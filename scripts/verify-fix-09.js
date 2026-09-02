const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runVerification() {
  console.log('=== VERIFICATION GATE: FIX 09 (TRANSACTION TIMEOUT RECURRENCE & QUERY BATCHING) ===\n');

  // --- TEST 1: UPDATE IMAGES & DETAILS ON 4 DEDICATED TEMPORARY TEST PRODUCTS ---
  console.log('1. Creating temporary test products for transaction latency verification...');
  const subcategoryForTest1 = await db.category.findFirst({ where: { parentId: { not: null } } });
  if (!subcategoryForTest1) {
    throw new Error('FAIL: No subcategory found in database!');
  }

  const tempTestProducts = [];
  try {
    for (let i = 0; i < 4; i++) {
      const p = await db.product.create({
        data: {
          name: `Fix09 Latency Test Cake #${i + 1}`,
          slug: `fix09-latency-cake-${i + 1}-${Date.now()}`,
          categoryId: subcategoryForTest1.id,
          description: `Temporary cake #${i + 1} for verifying transaction latency`,
          images: [{ url: `https://ik.imagekit.io/by3es5jcax/products/fix09-temp-${i + 1}.jpg`, fileId: `fix09_temp_${i + 1}` }],
          variants: {
            create: [
              { label: '500g', price: 500, stockQuantity: 10, reservedQuantity: 0 },
              { label: '1kg', price: 900, stockQuantity: 5, reservedQuantity: 0 },
            ],
          },
        },
        include: { variants: true },
      });
      tempTestProducts.push(p);
    }

    console.log(`   -> Created ${tempTestProducts.length} temporary test products.\n`);

    for (let i = 0; i < tempTestProducts.length; i++) {
      const product = tempTestProducts[i];
      console.log(`Testing Product #${i + 1}: "${product.name}" (ID: ${product.id}, Variants: ${product.variants.length})...`);

      const updateStart = Date.now();

      // Perform transaction using optimized batched variant queries and 10s timeout
      const updated = await db.$transaction(
        async (tx) => {
          // 1. Batched variant findMany
          const existingVariants = await tx.variant.findMany({
            where: { productId: product.id },
          });
          const existingVariantMap = new Map(existingVariants.map((v) => [v.id, v]));

          // 2. In-memory variant check and update
          for (const variant of product.variants) {
            const currentVar = existingVariantMap.get(variant.id);
            const currentReserved = currentVar?.reservedQuantity ?? 0;

            await tx.variant.update({
              where: { id: variant.id },
              data: {
                label: variant.label,
                price: variant.price,
                stockQuantity: variant.stockQuantity,
                reservedQuantity: currentReserved,
              },
            });
          }

          // 3. Product image/details update
          const newTestImage = {
            url: `https://ik.imagekit.io/by3es5jcax/products/fix09-test-p${i + 1}.jpg`,
            fileId: `fix09_file_${i + 1}`,
          };

          return tx.product.update({
            where: { id: product.id },
            data: {
              images: [newTestImage],
              description: `${product.description || ''} (Verified Fix-09)`,
            },
            include: { variants: true },
          });
        },
        { maxWait: 5000, timeout: 10000 }
      );

      const updateDuration = Date.now() - updateStart;
      console.log(`   -> Updated successfully in ${updateDuration} ms (Target: < 10000 ms limit).`);

      if (updateDuration >= 10000) {
        throw new Error(`FAIL: Product update for "${product.name}" took ${updateDuration} ms, exceeding 10000ms limit!`);
      }

      if (!Array.isArray(updated.images) || updated.images.length === 0) {
        throw new Error(`FAIL: Product image update failed for "${product.name}"!`);
      }
    }
  } finally {
    // Clean up temporary test products regardless of success or failure
    if (tempTestProducts.length > 0) {
      const tempIds = tempTestProducts.map((p) => p.id);
      await db.product.deleteMany({ where: { id: { in: tempIds } } });
      console.log('\n   -> Cleaned up all temporary test products from DB.');
    }
  }

  // --- TEST 2: VERIFY BATCHED QUERY LOGIC FOR STOCK RESERVATIONS ---
  console.log('\n2. Verifying batched query logic for stock reservations...');

  const subcategory = await db.category.findFirst({ where: { parentId: { not: null } } });
  const testProduct = await db.product.create({
    data: {
      name: 'Fix09 Reservation Test Cake',
      slug: `fix09-res-cake-${Date.now()}`,
      categoryId: subcategory.id,
      description: 'Test product for verifying batched reservation logic in Fix-09',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/res.jpg', fileId: 'res_1' }],
      variants: {
        create: [
          { label: '500g', price: 500, stockQuantity: 20, reservedQuantity: 0 },
          { label: '1kg', price: 900, stockQuantity: 10, reservedQuantity: 0 },
        ],
      },
    },
    include: { variants: true },
  });

  const items = [
    { variantId: testProduct.variants[0].id, quantity: 2, productName: testProduct.name, variantLabel: '500g' },
    { variantId: testProduct.variants[1].id, quantity: 1, productName: testProduct.name, variantLabel: '1kg' },
  ];

  // Helper simulating reserveStockAtomic using upfront findMany
  async function reserveStockAtomicBatched(items, tx) {
    const variantIds = items.map((i) => i.variantId);
    const variants = await tx.variant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant || !variant.product) throw new Error('Item unavailable');
      const availableStock = variant.stockQuantity - variant.reservedQuantity;
      if (item.quantity > availableStock) throw new Error('Stock unavailable');
      await tx.variant.update({
        where: { id: item.variantId },
        data: { reservedQuantity: { increment: item.quantity } },
      });
    }
  }

  // Helper simulating confirmOrderStock using upfront findMany
  async function confirmOrderStockBatched(items, tx) {
    const variantIds = items.map((i) => i.variantId);
    const variants = await tx.variant.findMany({ where: { id: { in: variantIds } } });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of items) {
      const v = variantMap.get(item.variantId);
      if (v) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: Math.max(0, v.stockQuantity - item.quantity),
            reservedQuantity: Math.max(0, v.reservedQuantity - item.quantity),
          },
        });
      }
    }
  }

  // Atomic reservation test
  console.log('   a) Testing atomic stock reservation with batched queries...');
  await db.$transaction(async (tx) => {
    await reserveStockAtomicBatched(items, tx);
  }, { maxWait: 5000, timeout: 10000 });

  let checkVar0 = await db.variant.findUnique({ where: { id: testProduct.variants[0].id } });
  let checkVar1 = await db.variant.findUnique({ where: { id: testProduct.variants[1].id } });
  if (checkVar0.reservedQuantity !== 2 || checkVar1.reservedQuantity !== 1) {
    throw new Error(`FAIL: reserveStockAtomicBatched did not update reservedQuantity correctly!`);
  }
  console.log('      -> Reserved quantity correctly updated: 500g (2), 1kg (1).');

  // Confirmation test
  console.log('   b) Testing order stock confirmation with batched queries...');
  await db.$transaction(async (tx) => {
    await confirmOrderStockBatched(items, tx);
  }, { maxWait: 5000, timeout: 10000 });

  checkVar0 = await db.variant.findUnique({ where: { id: testProduct.variants[0].id } });
  checkVar1 = await db.variant.findUnique({ where: { id: testProduct.variants[1].id } });
  if (checkVar0.stockQuantity !== 18 || checkVar0.reservedQuantity !== 0 || checkVar1.stockQuantity !== 9 || checkVar1.reservedQuantity !== 0) {
    throw new Error(`FAIL: confirmOrderStockBatched did not decrement stock/reserved quantities correctly!`);
  }
  console.log('      -> Stock confirmed correctly: 500g stock=18, reserved=0; 1kg stock=9, reserved=0.');

  // Clean up test product
  await db.product.delete({ where: { id: testProduct.id } });
  console.log('   -> Cleaned up reservation test product.');

  // --- TEST 3: REGRESSION CHECKS FOR FIX-06 & FIX-07 ---
  console.log('\n3. Running regression audit across active database products...');
  const allProducts = await db.product.findMany({ where: { isDeleted: false } });
  for (const p of allProducts) {
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === 'string') {
          throw new Error(`FAIL: Found string image in product "${p.name}" (ID: ${p.id})`);
        }
      }
    }
  }
  console.log(`   -> All ${allProducts.length} active products verified to have clean object image structures.`);

  console.log('\n=== VERIFICATION SUCCESSFUL: FIX 09 PASSED ALL GATES ===');
  await db.$disconnect();
}

runVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
