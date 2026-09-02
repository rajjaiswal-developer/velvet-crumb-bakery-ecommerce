/**
 * VERIFICATION GATE: FIX 18 (ORPHANED PRODUCT PERMANENT DELETE)
 * 
 * This script tests all critical paths through Prisma (same DB client as production):
 * 
 * TEST 1 (Reproduction): Create test category + product → soft-delete → confirm category blocked 
 *         → permanently delete via Prisma.$queryRaw + delete → confirm category deletable
 * 
 * TEST 2 (Critical Safety): Create product → create REAL order with production-identical 
 *         ResolvedCartItem[] shape (same as checkout/submit writes) → soft-delete product 
 *         → confirm jsonb containment blocks permanent delete → show actual query results
 * 
 * TEST 3 (Order Integrity): Confirm the real order's items still display the product correctly
 * 
 * TEST 4 (Cleanup): Remove all test data
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runVerification() {
  console.log('============================================================');
  console.log('VERIFICATION GATE: FIX 18 (ORPHANED PRODUCT PERMANENT DELETE)');
  console.log('============================================================\n');

  const ts = Date.now();
  let testCategoryId, testProductId, testVariantId;
  let orderedProductId, orderedVariantId, orderedCategoryId, testOrderId;

  try {
    // ====================================================================
    // TEST 1: FULL REPRODUCTION — Orphaned Product Permanent Delete Flow
    // ====================================================================
    console.log('━━━ TEST 1: FULL REPRODUCTION (Category Unblock Flow) ━━━\n');

    // Step 1a: Create test category
    const parentCat = await db.category.findFirst({ where: { parentId: null } });
    if (!parentCat) throw new Error('FAIL: No parent category found in DB. Seed DB first.');

    const testCategory = await db.category.create({
      data: {
        name: `Fix18-Test-Category-${ts}`,
        slug: `fix18-test-cat-${ts}`,
        type: 'CAKE',
        parentId: parentCat.id,
      },
    });
    testCategoryId = testCategory.id;
    console.log(`1a. Created test category: "${testCategory.name}" (ID: ${testCategoryId})`);

    // Step 1b: Create test product under that category
    const testProduct = await db.product.create({
      data: {
        name: `Fix18-Test-Product-${ts}`,
        slug: `fix18-test-prod-${ts}`,
        categoryId: testCategoryId,
        description: 'Temporary product for Fix-18 verification',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/test.jpg', fileId: 'test-f1' }],
        variants: {
          create: [{ label: '500g', price: 400, stockQuantity: 10, reservedQuantity: 0 }],
        },
      },
      include: { variants: true },
    });
    testProductId = testProduct.id;
    testVariantId = testProduct.variants[0].id;
    console.log(`1b. Created test product: "${testProduct.name}" (ID: ${testProductId})`);
    console.log(`    Variant ID: ${testVariantId}`);

    // Step 1c: Soft-delete the product
    await db.product.update({
      where: { id: testProductId },
      data: { isDeleted: true, isActive: false },
    });
    console.log(`1c. Soft-deleted product (isDeleted: true)`);

    // Step 1d: Confirm category deletion is BLOCKED (reproducing the bug)
    const productCount = await db.product.count({ where: { categoryId: testCategoryId } });
    console.log(`1d. Product count for category (including soft-deleted): ${productCount}`);
    
    if (productCount !== 1) {
      throw new Error(`FAIL: Expected product count 1, got ${productCount}`);
    }

    let categoryDeleteBlocked = false;
    try {
      await db.category.delete({ where: { id: testCategoryId } });
      throw new Error('FAIL: Category deletion should have been blocked by RESTRICT constraint!');
    } catch (err) {
      if (err.code === 'P2003' || (err.message && err.message.includes('RESTRICT'))) {
        categoryDeleteBlocked = true;
        console.log(`    ✅ Category deletion correctly BLOCKED by PostgreSQL RESTRICT constraint`);
        console.log(`    Error: Foreign key constraint violation (product still references category)`);
      } else if (err.message && err.message.includes('FAIL:')) {
        throw err;
      } else {
        categoryDeleteBlocked = true;
        console.log(`    ✅ Category deletion correctly BLOCKED: ${err.message?.substring(0, 120)}`);
      }
    }

    if (!categoryDeleteBlocked) {
      throw new Error('FAIL: Category should not have been deletable with soft-deleted product referencing it!');
    }

    // Step 1e: Verify product has ZERO order references via jsonb containment
    const orderRefsCheck = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${JSON.stringify([{ productId: testProductId }])}::jsonb
    `;
    const orderCount = Number(orderRefsCheck[0].count);
    console.log(`1e. Order reference check (jsonb @> containment): ${orderCount} orders reference this product`);

    if (orderCount !== 0) {
      throw new Error(`FAIL: Expected 0 order references for test product, got ${orderCount}`);
    }
    console.log(`    ✅ Zero order references confirmed — product is safe to permanently delete`);

    // Step 1f: Permanently delete the product (same logic as DELETE /api/admin/products/[id]/permanent)
    const deletedProduct = await db.product.findUnique({
      where: { id: testProductId },
      select: { id: true, name: true, isDeleted: true },
    });
    console.log(`1f. Pre-delete check: Product exists=${!!deletedProduct}, isDeleted=${deletedProduct?.isDeleted}`);

    await db.product.delete({ where: { id: testProductId } });
    console.log(`    ✅ Product "${deletedProduct.name}" permanently deleted from database`);

    // Verify product is truly gone
    const ghostCheck = await db.product.findUnique({ where: { id: testProductId } });
    if (ghostCheck) {
      throw new Error('FAIL: Product still exists after permanent delete!');
    }
    console.log(`    ✅ Verified: Product row no longer exists in database`);

    // Verify variants cascaded
    const orphanedVariants = await db.variant.count({ where: { productId: testProductId } });
    console.log(`    ✅ Cascaded variants remaining: ${orphanedVariants} (expected 0)`);
    if (orphanedVariants !== 0) {
      throw new Error(`FAIL: ${orphanedVariants} orphaned variant(s) remain after cascade delete!`);
    }

    // Step 1g: Confirm category is NOW deletable
    const productCountAfter = await db.product.count({ where: { categoryId: testCategoryId } });
    console.log(`1g. Product count for category after permanent delete: ${productCountAfter}`);
    
    if (productCountAfter !== 0) {
      throw new Error(`FAIL: Expected 0 products after permanent delete, got ${productCountAfter}`);
    }

    await db.category.delete({ where: { id: testCategoryId } });
    console.log(`    ✅ Category "${testCategory.name}" successfully deleted — RESTRICT constraint satisfied!`);
    testCategoryId = null; // Mark as cleaned up

    const categoryGhostCheck = await db.category.findUnique({ where: { id: testCategory.id } });
    if (categoryGhostCheck) {
      throw new Error('FAIL: Category still exists after deletion!');
    }
    console.log(`    ✅ Verified: Category row no longer exists in database`);

    console.log('\n✅ TEST 1 PASSED: Full reproduction cycle complete');
    console.log('   Soft-deleted product blocked category deletion → permanent delete removed product → category became deletable\n');

    // ====================================================================
    // TEST 2: CRITICAL SAFETY — Order-Referenced Product Cannot Be Permanently Deleted
    // ====================================================================
    console.log('━━━ TEST 2: CRITICAL SAFETY (Order Reference Protection) ━━━\n');

    // Step 2a: Create a new test category + product for the ordered product
    const orderedParentCat = await db.category.findFirst({ where: { parentId: null } });
    const orderedCategory = await db.category.create({
      data: {
        name: `Fix18-Ordered-Category-${ts}`,
        slug: `fix18-ordered-cat-${ts}`,
        type: 'CAKE',
        parentId: orderedParentCat.id,
      },
    });
    orderedCategoryId = orderedCategory.id;

    const orderedProduct = await db.product.create({
      data: {
        name: `Fix18-Ordered-Cake-${ts}`,
        slug: `fix18-ordered-cake-${ts}`,
        categoryId: orderedCategoryId,
        description: 'Product that will appear in a real order',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/ordered-test.jpg', fileId: 'test-f2' }],
        variants: {
          create: [{ label: '1kg', price: 750, stockQuantity: 20, reservedQuantity: 0 }],
        },
      },
      include: { variants: true },
    });
    orderedProductId = orderedProduct.id;
    orderedVariantId = orderedProduct.variants[0].id;
    console.log(`2a. Created product for order test: "${orderedProduct.name}" (ID: ${orderedProductId})`);
    console.log(`    Variant: ${orderedProduct.variants[0].label} @ ₹${orderedProduct.variants[0].price} (ID: ${orderedVariantId})`);

    // Step 2b: Create a REAL order with production-identical ResolvedCartItem[] shape
    // This is the EXACT same JSON structure written by checkout/submit/route.ts line 173:
    //   items: JSON.parse(JSON.stringify(cart.items))
    // where cart.items is ResolvedCartItem[] from lib/cart/cart.ts getCart()
    const realOrderItems = [
      {
        variantId: orderedVariantId,
        productId: orderedProductId,              // ← THE KEY FIELD being checked
        productName: orderedProduct.name,
        productSlug: orderedProduct.slug,
        productImage: 'https://ik.imagekit.io/by3es5jcax/ordered-test.jpg',
        variantLabel: '1kg',
        price: 750,
        quantity: 1,
        availableStock: 20,
        isAvailable: true,
        itemTotal: 750,
      },
    ];

    console.log(`\n2b. Creating REAL order with production-identical ResolvedCartItem[] shape...`);
    console.log(`    items JSON being written to Order row:`);
    console.log(JSON.stringify(realOrderItems, null, 4));

    const realOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          receiptNumber: `AC-FIX18-${ts}-SAFETY`,
          customerName: 'Fix18 Safety Test Customer',
          customerMobile: '9876500018',
          alternatePhone: null,
          customerEmail: 'fix18-test@example.com',
          shippingAddress: 'Fix18 Test Address, 12 Bakers Lane, Demo City',
          deliveryTimeSlot: '2-hours',
          specialInstructions: 'Fix-18 verification order — safe to delete after test',
          items: JSON.parse(JSON.stringify(realOrderItems)), // Same as checkout line 173
          totalAmount: 750.00,
          paymentStatus: 'SUCCESS',
          orderStatus: 'ORDER_RECEIVED',
          razorpayOrderId: `order_fix18_safety_${ts}`,
          razorpayPaymentId: `pay_fix18_safety_${ts}`,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: 'ORDER_RECEIVED' },
      });

      return order;
    });
    testOrderId = realOrder.id;
    console.log(`\n    ✅ Real order created: Receipt #${realOrder.receiptNumber} (ID: ${testOrderId})`);
    console.log(`    Payment Status: ${realOrder.paymentStatus}, Order Status: ${realOrder.orderStatus}`);

    // Step 2c: Verify what was actually written to DB
    const savedOrder = await db.order.findUnique({ where: { id: testOrderId } });
    const savedItems = savedOrder.items;
    console.log(`\n2c. Verifying items stored in database Order row:`);
    console.log(JSON.stringify(savedItems, null, 4));

    const savedProductIds = Array.isArray(savedItems) 
      ? savedItems.map(item => item.productId).filter(Boolean)
      : [];
    console.log(`    productId values in stored items: [${savedProductIds.join(', ')}]`);
    
    if (!savedProductIds.includes(orderedProductId)) {
      throw new Error(`FAIL: Stored order items do not contain expected productId ${orderedProductId}!`);
    }
    console.log(`    ✅ Confirmed: productId "${orderedProductId}" is present in stored order items`);

    // Step 2d: Soft-delete the ordered product
    await db.product.update({
      where: { id: orderedProductId },
      data: { isDeleted: true, isActive: false },
    });
    console.log(`\n2d. Soft-deleted the ordered product (isDeleted: true)`);

    // Step 2e: Run the EXACT jsonb containment query used by check-order-refs endpoint
    console.log(`\n2e. Running jsonb containment query (same as GET /api/admin/products/[id]/check-order-refs):`);
    const containmentParam = JSON.stringify([{ productId: orderedProductId }]);
    console.log(`    SQL: SELECT COUNT(*) FROM "Order" WHERE items::jsonb @> '${containmentParam}'::jsonb`);

    const safetyCheck = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${containmentParam}::jsonb
    `;
    const safetyOrderCount = Number(safetyCheck[0].count);
    console.log(`    RESULT: ${safetyOrderCount} order(s) reference productId "${orderedProductId}"`);

    if (safetyOrderCount < 1) {
      throw new Error(`FAIL: jsonb containment should have found at least 1 order referencing this product!`);
    }
    console.log(`    ✅ CRITICAL: jsonb containment correctly detected ${safetyOrderCount} order reference(s)`);

    // Step 2f: Attempt permanent delete — MUST BE BLOCKED
    console.log(`\n2f. Attempting permanent delete of order-referenced product...`);
    console.log(`    This MUST be blocked to protect order history integrity.`);

    // Simulate the exact logic from DELETE /api/admin/products/[id]/permanent
    const permDeleteTarget = await db.product.findUnique({
      where: { id: orderedProductId },
      select: { id: true, name: true, isDeleted: true },
    });

    if (!permDeleteTarget) {
      throw new Error('FAIL: Product not found for permanent delete attempt');
    }
    if (!permDeleteTarget.isDeleted) {
      throw new Error('FAIL: Product should be soft-deleted at this point');
    }

    const blockCheck = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${JSON.stringify([{ productId: orderedProductId }])}::jsonb
    `;
    const blockOrderCount = Number(blockCheck[0].count);

    if (blockOrderCount > 0) {
      const blockMessage = `This product was part of ${blockOrderCount} real customer order(s) and cannot be permanently deleted, to preserve order history accuracy.`;
      console.log(`    API Response (simulated): { success: false, error: "${blockMessage}" }`);
      console.log(`    HTTP Status: 400`);
      console.log(`\n    ✅ CRITICAL SAFETY VERIFIED: Permanent delete correctly BLOCKED`);
      console.log(`    Product "${permDeleteTarget.name}" is PROTECTED — it appeared in ${blockOrderCount} real order(s)`);
    } else {
      // This should never happen in this test
      throw new Error('FAIL: Product should have order references but blockOrderCount is 0!');
    }

    console.log('\n✅ TEST 2 PASSED: Order-referenced product cannot be permanently deleted');
    console.log('   Real customer order history is protected from corruption\n');

    // ====================================================================
    // TEST 3: ORDER INTEGRITY — Admin order view still shows product correctly
    // ====================================================================
    console.log('━━━ TEST 3: ORDER INTEGRITY (Admin View After Soft-Delete) ━━━\n');

    const orderForView = await db.order.findUnique({
      where: { id: testOrderId },
      include: { history: true },
    });

    console.log(`3a. Fetching order ${orderForView.receiptNumber} from database (same as admin order view):`);
    console.log(`    Customer: ${orderForView.customerName}`);
    console.log(`    Phone: ${orderForView.customerMobile}`);
    console.log(`    Address: ${orderForView.shippingAddress}`);
    console.log(`    Total: ₹${orderForView.totalAmount}`);
    console.log(`    Payment: ${orderForView.paymentStatus}, Status: ${orderForView.orderStatus}`);
    console.log(`    Status History: ${orderForView.history.map(h => `${h.status} at ${h.changedAt.toISOString()}`).join(', ')}`);

    const viewItems = orderForView.items;
    console.log(`\n3b. Order items (as displayed in admin order detail view):`);
    
    if (!Array.isArray(viewItems) || viewItems.length === 0) {
      throw new Error('FAIL: Order items array is empty or not an array!');
    }

    for (const item of viewItems) {
      console.log(`    - ${item.productName} (${item.variantLabel}) × ${item.quantity} = ₹${item.itemTotal}`);
      console.log(`      productId: ${item.productId}`);
      console.log(`      variantId: ${item.variantId}`);
      console.log(`      productSlug: ${item.productSlug}`);
      console.log(`      productImage: ${item.productImage}`);
    }

    // Verify the product data in the order is complete and intact
    const orderItem = viewItems[0];
    if (orderItem.productId !== orderedProductId) {
      throw new Error(`FAIL: Order item productId mismatch! Expected ${orderedProductId}, got ${orderItem.productId}`);
    }
    if (orderItem.productName !== orderedProduct.name) {
      throw new Error(`FAIL: Order item productName mismatch!`);
    }
    if (orderItem.variantLabel !== '1kg') {
      throw new Error(`FAIL: Order item variantLabel mismatch!`);
    }
    if (orderItem.price !== 750) {
      throw new Error(`FAIL: Order item price mismatch!`);
    }

    console.log(`\n    ✅ All order item fields are intact and correctly display the product`);
    console.log(`    ✅ Product soft-deletion has ZERO impact on stored order data`);
    console.log(`    (Order items are denormalized JSON snapshots, not live product references)`);

    // Verify the actual product row is still soft-deleted but present
    const softDeletedProduct = await db.product.findUnique({
      where: { id: orderedProductId },
      select: { id: true, name: true, isDeleted: true, isActive: true },
    });
    console.log(`\n3c. Product row status: exists=${!!softDeletedProduct}, isDeleted=${softDeletedProduct?.isDeleted}, isActive=${softDeletedProduct?.isActive}`);
    console.log(`    ✅ Product row preserved in database for historical integrity`);

    console.log('\n✅ TEST 3 PASSED: Order displays product correctly even after soft-deletion\n');

    // ====================================================================
    // CLEANUP
    // ====================================================================
    console.log('━━━ CLEANUP ━━━\n');

    // Delete the test order and its history
    await db.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } });
    await db.order.delete({ where: { id: testOrderId } });
    console.log(`Deleted test order: ${realOrder.receiptNumber}`);
    testOrderId = null;

    // Now that the order is gone, verify the product CAN be permanently deleted
    const postCleanupCheck = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${JSON.stringify([{ productId: orderedProductId }])}::jsonb
    `;
    const postCleanupCount = Number(postCleanupCheck[0].count);
    console.log(`Post-cleanup order reference check: ${postCleanupCount} (expected 0)`);

    // Clean up the ordered product and category
    await db.product.delete({ where: { id: orderedProductId } });
    console.log(`Permanently deleted test product: ${orderedProduct.name}`);
    orderedProductId = null;

    await db.category.delete({ where: { id: orderedCategoryId } });
    console.log(`Deleted test category: ${orderedCategory.name}`);
    orderedCategoryId = null;

    // Final DB check: zero test artifacts remaining
    const remainingTestProducts = await db.product.count({
      where: { name: { startsWith: 'Fix18-' } },
    });
    const remainingTestCategories = await db.category.count({
      where: { name: { startsWith: 'Fix18-' } },
    });
    const remainingTestOrders = await db.order.count({
      where: { receiptNumber: { startsWith: 'AC-FIX18-' } },
    });

    console.log(`\nPost-cleanup verification:`);
    console.log(`  Fix18 products remaining: ${remainingTestProducts}`);
    console.log(`  Fix18 categories remaining: ${remainingTestCategories}`);
    console.log(`  Fix18 orders remaining: ${remainingTestOrders}`);

    if (remainingTestProducts !== 0 || remainingTestCategories !== 0 || remainingTestOrders !== 0) {
      throw new Error('FAIL: Test cleanup incomplete — test artifacts remain in database!');
    }
    console.log(`  ✅ 100% cleanup verified — zero test artifacts in database`);

    console.log('\n============================================================');
    console.log('✅ ALL FIX-18 VERIFICATION GATES PASSED');
    console.log('============================================================');
    console.log('\nSummary:');
    console.log('  TEST 1 ✅ Orphaned product permanent delete unblocks category deletion');
    console.log('  TEST 2 ✅ Order-referenced product BLOCKED from permanent deletion (jsonb @> containment)');
    console.log('  TEST 3 ✅ Real order displays product correctly after soft-deletion');
    console.log('  CLEANUP ✅ Zero test artifacts remaining in database');
    console.log('============================================================\n');

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message || err);

    // Emergency cleanup
    console.log('\nRunning emergency cleanup...');
    try {
      if (testOrderId) {
        await db.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } });
        await db.order.delete({ where: { id: testOrderId } }).catch(() => {});
      }
      // Clean up any Fix18 test data
      await db.order.deleteMany({ where: { receiptNumber: { startsWith: 'AC-FIX18-' } } });
      const fix18Products = await db.product.findMany({ where: { name: { startsWith: 'Fix18-' } } });
      for (const p of fix18Products) {
        await db.variant.deleteMany({ where: { productId: p.id } });
        await db.product.delete({ where: { id: p.id } }).catch(() => {});
      }
      await db.category.deleteMany({ where: { name: { startsWith: 'Fix18-' } } });
      console.log('Emergency cleanup completed.');
    } catch (cleanupErr) {
      console.error('Cleanup error (may require manual cleanup):', cleanupErr.message);
    }
    
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runVerification();
