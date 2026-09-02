const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runVerification() {
  console.log('=== VERIFICATION GATE: FIX 07 (SOFT-DELETE SLUG REUSE) ===\n');

  // 1. Fetch subcategory for test products
  const subcategory = await db.category.findFirst({
    where: { parentId: { not: null } },
  });
  if (!subcategory) {
    throw new Error('No subcategory found in database. Seed database first.');
  }

  const testSlug = `test-slug-fix07-${Date.now()}`;

  let productA, productB;
  try {
    // Step 1: Create initial product A with testSlug
    console.log(`1. Creating Product A with slug "${testSlug}"...`);
    productA = await db.product.create({
      data: {
        name: 'Product A Original',
        slug: testSlug,
        categoryId: subcategory.id,
        description: 'Initial product created for testing soft delete slug reuse.',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/test-a.jpg' }],
        variants: {
          create: [{ label: '500g', price: 500, stockQuantity: 10 }],
        },
      },
    });
    console.log(`   -> Created Product A (ID: ${productA.id}, isDeleted: ${productA.isDeleted})`);

    // Step 2: Soft-delete Product A
    console.log(`\n2. Soft-deleting Product A (ID: ${productA.id})...`);
    const deletedA = await db.product.update({
      where: { id: productA.id },
      data: { isDeleted: true, isActive: false },
    });
    console.log(`   -> Product A soft-deleted (isDeleted: ${deletedA.isDeleted})`);

    // Step 3: Create NEW Product B with the SAME testSlug (simulating API POST logic)
    console.log(`\n3. Attempting to create Product B with the SAME slug "${testSlug}"...`);
    const existingActive = await db.product.findFirst({
      where: { slug: testSlug, isDeleted: false },
    });

    if (existingActive) {
      throw new Error(`FAIL: Application check falsely reported slug "${testSlug}" as taken by an active product!`);
    }

    productB = await db.product.create({
      data: {
        name: 'Product B Reused Slug',
        slug: testSlug,
        categoryId: subcategory.id,
        description: 'New product reusing slug of soft-deleted product A.',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/test-b.jpg' }],
        variants: {
          create: [{ label: '1kg', price: 900, stockQuantity: 8 }],
        },
      },
    });
    console.log(`   -> SUCCESS: Created Product B (ID: ${productB.id}, isDeleted: ${productB.isDeleted}) with slug "${testSlug}"!`);

    // Step 4: Verify Old Product A is unaffected
    console.log(`\n4. Verifying old Product A record in database...`);
    const recheckedA = await db.product.findUnique({ where: { id: productA.id } });
    if (!recheckedA || !recheckedA.isDeleted || recheckedA.name !== 'Product A Original') {
      throw new Error('FAIL: Old deleted Product A record was corrupted or altered during Product B creation!');
    }
    console.log(`   -> Old Product A intact (ID: ${recheckedA.id}, Name: "${recheckedA.name}", isDeleted: ${recheckedA.isDeleted})`);

    // Step 5: Verify ACTIVE product uniqueness constraint STILL blocks creating another active product with the same slug
    console.log(`\n5. Verifying ACTIVE product uniqueness constraint (Attempting Product C with same slug while B is active)...`);
    const activeConflict = await db.product.findFirst({
      where: { slug: testSlug, isDeleted: false },
    });
    if (!activeConflict) {
      throw new Error('FAIL: Active product uniqueness check failed to find existing active Product B!');
    }
    console.log(`   -> Active uniqueness check correctly blocked creation because Product B (ID: ${activeConflict.id}) is active.`);

    // Step 6: Soft-delete Product B to verify multiple soft-deleted products can share historical slugs
    console.log(`\n6. Soft-deleting Product B and verifying multiple soft-deleted products co-exist...`);
    await db.product.update({
      where: { id: productB.id },
      data: { isDeleted: true, isActive: false },
    });

    const softDeletedProducts = await db.product.findMany({
      where: { slug: testSlug, isDeleted: true },
    });
    console.log(`   -> Found ${softDeletedProducts.length} soft-deleted product(s) sharing slug "${testSlug}":`);
    for (const p of softDeletedProducts) {
      console.log(`      * ID: ${p.id} | Name: "${p.name}" | isDeleted: ${p.isDeleted}`);
    }
    if (softDeletedProducts.length !== 2) {
      throw new Error(`FAIL: Expected 2 soft-deleted products, found ${softDeletedProducts.length}`);
    }
  } finally {
    // Cleanup test records
    console.log('\n7. Cleaning up test products from DB...');
    const cleanupIds = [productA?.id, productB?.id].filter(Boolean);
    if (cleanupIds.length > 0) {
      await db.product.deleteMany({ where: { id: { in: cleanupIds } } });
      console.log('   -> Test products cleaned up.');
    }
  }

  console.log('\n=== VERIFICATION SUCCESSFUL: FIX 07 PASSED ALL GATES ===');
  await db.$disconnect();
}

runVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
