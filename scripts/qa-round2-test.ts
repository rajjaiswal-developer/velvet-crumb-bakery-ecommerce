import { db } from '../lib/db/client';
import { checkoutInputSchema } from '../lib/validation/schemas';
import { formatStructuredAddress } from '../lib/delivery/address-formatter';

async function runComprehensiveTests() {
  console.log('=====================================================');
  console.log('STARTING COMPREHENSIVE QA ROUND 2 AUDIT SCRIPT');
  console.log('=====================================================\n');

  const results: { test: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  // ----------------------------------------------------
  // PART A - TEST 1: Checkout Field Length Limits
  // ----------------------------------------------------
  console.log('--- PART A.1: [ISSUE-001] Checkout Input Bounds ---');
  
  // Name max 100
  const validName100 = 'A'.repeat(100);
  const invalidName101 = 'A'.repeat(101);
  
  const baseValidData = {
    name: 'Valid Name',
    phone: '9820098200',
    confirmPhone: '9820098200',
    flatBuilding: 'Flat 101, Test Bldg',
    street: 'LBS Marg',
    area: 'Demo City',
    pincode: '400086',
    deliveryTimeSlot: '1-hour' as const,
    specialInstructions: 'None',
  };

  const nameParseValid = checkoutInputSchema.safeParse({ ...baseValidData, name: validName100 });
  const nameParseInvalid = checkoutInputSchema.safeParse({ ...baseValidData, name: invalidName101 });
  
  if (nameParseValid.success && !nameParseInvalid.success) {
    results.push({ test: 'Name max 100 char limit', status: 'PASS', details: '100 chars allowed, 101 chars rejected cleanly.' });
  } else {
    results.push({ test: 'Name max 100 char limit', status: 'FAIL', details: `Valid: ${nameParseValid.success}, Invalid: ${nameParseInvalid.success}` });
  }

  // Special instructions max 500
  const validInstructions500 = 'B'.repeat(500);
  const invalidInstructions501 = 'B'.repeat(501);
  const instrValid = checkoutInputSchema.safeParse({ ...baseValidData, specialInstructions: validInstructions500 });
  const instrInvalid = checkoutInputSchema.safeParse({ ...baseValidData, specialInstructions: invalidInstructions501 });
  
  if (instrValid.success && !instrInvalid.success) {
    results.push({ test: 'Special Instructions max 500 char limit', status: 'PASS', details: '500 chars allowed, 501 chars rejected cleanly.' });
  } else {
    results.push({ test: 'Special Instructions max 500 char limit', status: 'FAIL', details: `Valid: ${instrValid.success}, Invalid: ${instrInvalid.success}` });
  }

  // Building / Street / Landmark max 150
  const validBuilding150 = 'C'.repeat(150);
  const invalidBuilding151 = 'C'.repeat(151);
  const bldgValid = checkoutInputSchema.safeParse({ ...baseValidData, flatBuilding: validBuilding150 });
  const bldgInvalid = checkoutInputSchema.safeParse({ ...baseValidData, flatBuilding: invalidBuilding151 });

  if (bldgValid.success && !bldgInvalid.success) {
    results.push({ test: 'Building field max 150 char limit', status: 'PASS', details: '150 chars allowed, 151 chars rejected.' });
  } else {
    results.push({ test: 'Building field max 150 char limit', status: 'FAIL', details: `Valid: ${bldgValid.success}, Invalid: ${bldgInvalid.success}` });
  }

  // ----------------------------------------------------
  // PART A - TEST 2: Tracking Lookup Matches EITHER Phone
  // ----------------------------------------------------
  console.log('\n--- PART A.2: [ISSUE-002] Order Tracking Dual Phone Lookup ---');
  const primaryPhone = '9820098200';
  const alternatePhone = '9819998199';
  const thirdPhone = '9800098000';
  const testReceipt = `TEST-QA2-${Date.now()}`;

  const testOrder = await db.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'QA Test User',
      customerMobile: primaryPhone,
      alternatePhone: alternatePhone,
      customerEmail: 'qa@example.com',
      shippingAddress: 'Flat 101, Test Bldg, 12 Bakers Lane, Demo City',
      totalAmount: 500,
      paymentStatus: 'SUCCESS',
      orderStatus: 'PROCESSING',
      items: [{ productId: 'test-p-id', variantId: 'test-v-id', productName: 'Test Cake', price: 500, quantity: 1 }],
      deliveryTimeSlot: '12:00 PM - 02:00 PM',
    },
  });

  try {
    // Lookup with primary
    const trackPrimary = await db.order.findFirst({
      where: {
        receiptNumber: testReceipt,
        OR: [{ customerMobile: primaryPhone }, { alternatePhone: primaryPhone }],
      },
    });

    // Lookup with alternate
    const trackAlternate = await db.order.findFirst({
      where: {
        receiptNumber: testReceipt,
        OR: [{ customerMobile: alternatePhone }, { alternatePhone: alternatePhone }],
      },
    });

    // Lookup with 3rd (unrelated) phone
    const trackThird = await db.order.findFirst({
      where: {
        receiptNumber: testReceipt,
        OR: [{ customerMobile: thirdPhone }, { alternatePhone: thirdPhone }],
      },
    });

    if (trackPrimary && trackAlternate && !trackThird) {
      results.push({
        test: 'Order tracking lookup dual phone match',
        status: 'PASS',
        details: 'Primary phone matched, Alternate phone matched, Unrelated phone returned null.',
      });
    } else {
      results.push({
        test: 'Order tracking lookup dual phone match',
        status: 'FAIL',
        details: `Primary: ${!!trackPrimary}, Alternate: ${!!trackAlternate}, Unrelated: ${!!trackThird}`,
      });
    }
  } finally {
    await db.order.delete({ where: { id: testOrder.id } });
  }

  // ----------------------------------------------------
  // PART B - TEST 1: Alternate Phone & Optional Email Combinations
  // ----------------------------------------------------
  console.log('\n--- PART B.1: Checkout Combinations (Phone & Email) ---');
  
  const combo1 = checkoutInputSchema.safeParse({
    ...baseValidData,
    name: 'Combo 1',
    mobile: '9820098200',
    confirmMobile: '9820098200',
    alternatePhone: '9819998199',
    email: 'test@example.com',
  });

  const combo2 = checkoutInputSchema.safeParse({
    ...baseValidData,
    name: 'Combo 2',
    mobile: '9820098200',
    confirmMobile: '9820098200',
    alternatePhone: '',
    email: '',
  });

  const combo3 = checkoutInputSchema.safeParse({
    ...baseValidData,
    name: 'Combo 3',
    mobile: '9820098200',
    confirmMobile: '9820098200',
    alternatePhone: '9819998199',
    email: '',
  });

  const combo4 = checkoutInputSchema.safeParse({
    ...baseValidData,
    name: 'Combo 4',
    mobile: '9820098200',
    confirmMobile: '9820098200',
    alternatePhone: '',
    email: 'test@example.com',
  });

  if (combo1.success && combo2.success && combo3.success && combo4.success) {
    results.push({
      test: 'Checkout all 4 phone/email combinations',
      status: 'PASS',
      details: 'All combinations (both, primary-only, alt-no-email, email-no-alt) parse successfully.',
    });
  } else {
    results.push({
      test: 'Checkout all 4 phone/email combinations',
      status: 'FAIL',
      details: `c1:${combo1.success}, c2:${combo2.success}, c3:${combo3.success}, c4:${combo4.success}`,
    });
  }

  // ----------------------------------------------------
  // PART B - TEST 3: Structured Address & PIN Validation
  // ----------------------------------------------------
  console.log('\n--- PART B.3: PIN Code & Structured Address Validation ---');
  
  const pinValid = checkoutInputSchema.safeParse({ ...baseValidData, pincode: '400086' });
  const pinShort = checkoutInputSchema.safeParse({ ...baseValidData, pincode: '40008' });
  const pinLong = checkoutInputSchema.safeParse({ ...baseValidData, pincode: '4000867' });
  const pinAlpha = checkoutInputSchema.safeParse({ ...baseValidData, pincode: '40008A' });
  const pinZero = checkoutInputSchema.safeParse({ ...baseValidData, pincode: '000086' });

  if (pinValid.success && !pinShort.success && !pinLong.success && !pinAlpha.success && !pinZero.success) {
    results.push({
      test: 'PIN code regex validation',
      status: 'PASS',
      details: '6-digit valid PIN accepted; short, long, non-numeric, and zero-prefix rejected.',
    });
  } else {
    results.push({
      test: 'PIN code regex validation',
      status: 'FAIL',
      details: `Valid:${pinValid.success}, Short:${pinShort.success}, Long:${pinLong.success}, Alpha:${pinAlpha.success}, Zero:${pinZero.success}`,
    });
  }

  const formattedAddr = formatStructuredAddress({
    flatBuilding: 'Flat 402, Building A',
    street: 'LBS Marg',
    landmark: 'Opposite Metro Station',
    area: 'Demo City',
    pincode: '400086',
  });

  if (formattedAddr === 'Flat 402, Building A, LBS Marg, Opposite Metro Station, 12 Bakers Lane, Demo City - 400086') {
    results.push({
      test: 'Structured address formatting',
      status: 'PASS',
      details: `Formatted string matches expected canonical shape: "${formattedAddr}"`,
    });
  } else {
    results.push({
      test: 'Structured address formatting',
      status: 'FAIL',
      details: `Got: "${formattedAddr}"`,
    });
  }

  // ----------------------------------------------------
  // PART B - TEST 4: Orphaned Product Permanent Delete Safeguard
  // ----------------------------------------------------
  console.log('\n--- PART B.4: Permanent Delete Safeguards & Order Reference Check ---');

  // Test 4a: Product WITH real order reference
  const prodWithOrder = await db.product.create({
    data: {
      name: 'QA Permanent Delete Test Prod - Ordered',
      slug: `qa-perm-delete-ordered-${Date.now()}`,
      description: 'Test product with order ref',
      categoryId: (await db.category.findFirst())?.id || '',
      isDeleted: true,
      variants: {
        create: { label: '500g', price: 600, stockQuantity: 10, reservedQuantity: 0 },
      },
    },
    include: { variants: true },
  });

  const orderWithProd = await db.order.create({
    data: {
      receiptNumber: `AC-QA-ORDERREF-${Date.now()}`,
      customerName: 'Order Ref Customer',
      customerMobile: '9820098200',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 600,
      paymentStatus: 'SUCCESS',
      orderStatus: 'DELIVERED',
      items: [{ productId: prodWithOrder.id, variantId: prodWithOrder.variants[0].id, productName: prodWithOrder.name, price: 600, quantity: 1 }],
      deliveryTimeSlot: '12:00 PM - 02:00 PM',
    },
  });

  // Query order ref using postgres jsonb containment query
  const queryResult: Array<{ count: bigint }> = await db.$queryRaw`
    SELECT COUNT(*)::bigint FROM "Order"
    WHERE items::jsonb @> ${JSON.stringify([{ productId: prodWithOrder.id }])}::jsonb
  `;
  const refCount = Number(queryResult[0]?.count || 0);

  if (refCount > 0) {
    results.push({
      test: 'PostgreSQL jsonb containment query detects product in Order.items',
      status: 'PASS',
      details: `Found ${refCount} order reference(s) for soft-deleted product ${prodWithOrder.id}`,
    });
  } else {
    results.push({
      test: 'PostgreSQL jsonb containment query detects product in Order.items',
      status: 'FAIL',
      details: `Expected >0 refs, got ${refCount}`,
    });
  }

  // Cleanup test order & product
  await db.order.delete({ where: { id: orderWithProd.id } });
  await db.variant.deleteMany({ where: { productId: prodWithOrder.id } });
  await db.product.delete({ where: { id: prodWithOrder.id } });

  // Test 4b: Product WITHOUT order reference (orphaned)
  const orphanedProd = await db.product.create({
    data: {
      name: 'QA Permanent Delete Test Prod - Orphaned',
      slug: `qa-perm-delete-orphaned-${Date.now()}`,
      description: 'Orphaned test product',
      categoryId: (await db.category.findFirst())?.id || '',
      isDeleted: true,
      variants: {
        create: { label: '500g', price: 400, stockQuantity: 5, reservedQuantity: 0 },
      },
    },
  });

  const orphanQueryResult: Array<{ count: bigint }> = await db.$queryRaw`
    SELECT COUNT(*)::bigint FROM "Order"
    WHERE items::jsonb @> ${JSON.stringify([{ productId: orphanedProd.id }])}::jsonb
  `;
  const orphanRefCount = Number(orphanQueryResult[0]?.count || 0);

  if (orphanRefCount === 0) {
    results.push({
      test: 'Orphaned soft-deleted product has zero order references',
      status: 'PASS',
      details: `Product ${orphanedProd.id} confirmed to have 0 order references.`,
    });
  } else {
    results.push({
      test: 'Orphaned soft-deleted product has zero order references',
      status: 'FAIL',
      details: `Expected 0 refs, got ${orphanRefCount}`,
    });
  }

  // Clean up orphaned test product
  await db.variant.deleteMany({ where: { productId: orphanedProd.id } });
  await db.product.delete({ where: { id: orphanedProd.id } });

  // ----------------------------------------------------
  // SUMMARY RESULTS
  // ----------------------------------------------------
  console.log('\n=====================================================');
  console.log('QA AUDIT SCRIPT TEST SUMMARY RESULTS');
  console.log('=====================================================');
  for (const r of results) {
    console.log(`[${r.status}] ${r.test} :: ${r.details}`);
  }

  return results;
}

runComprehensiveTests().catch((err) => {
  console.error('Fatal error in QA audit script:', err);
  process.exit(1);
});
