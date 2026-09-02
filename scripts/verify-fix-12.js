const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function verifyFix12() {
  console.log('====================================================');
  console.log('       VERIFICATION GATE FOR FIX-12');
  console.log('   Admin Search & Flavor Management (Foreign Key)');
  console.log('====================================================\n');

  // TEST 1: Foreign key relation schema verification
  console.log('[TEST 1] Verifying schema relation Product.flavorId -> Flavor.id...');
  const sampleProduct = await db.product.findFirst({
    where: { isDeleted: false, flavorId: { not: null } },
    include: { flavor: true },
  });

  if (!sampleProduct || !sampleProduct.flavor) {
    throw new Error('FAIL: Product.flavor relation not returned correctly!');
  }
  console.log(`✓ Foreign key relation verified! Product "${sampleProduct.name}" linked to Flavor "${sampleProduct.flavor.name}" (ID: ${sampleProduct.flavorId})`);

  // TEST 2: Flavor Edit (Rename) live lookup
  console.log('\n[TEST 2] Testing Flavor rename and live product display update...');
  const testFlavor = await db.flavor.create({
    data: { name: `TestFlavor_${Date.now()}` },
  });

  const testProduct = await db.product.create({
    data: {
      name: `Flavor Test Cake ${Date.now()}`,
      slug: `flavor-test-cake-${Date.now()}`,
      categoryId: sampleProduct.categoryId,
      description: 'Test product for Fix-12 flavor rename verification',
      flavorId: testFlavor.id,
      variants: {
        create: [{ label: '1kg', price: 999, stockQuantity: 5 }],
      },
    },
    include: { flavor: true },
  });

  console.log(`- Created temporary product "${testProduct.name}" assigned to flavor "${testProduct.flavor.name}"`);

  const newFlavorName = `RenamedFlavor_${Date.now()}`;
  await db.flavor.update({
    where: { id: testFlavor.id },
    data: { name: newFlavorName },
  });

  const reFetchedProduct = await db.product.findUnique({
    where: { id: testProduct.id },
    include: { flavor: true },
  });

  if (reFetchedProduct?.flavor?.name !== newFlavorName) {
    throw new Error(`FAIL: Flavor rename failed! Expected "${newFlavorName}", got "${reFetchedProduct?.flavor?.name}"`);
  }
  console.log(`✓ Flavor rename verified! Product live relation automatically updated to display "${reFetchedProduct.flavor.name}" without bulk updates.`);

  // TEST 3: Flavor Deletion with assigned product (SetNull behavior)
  console.log('\n[TEST 3] Testing Flavor deletion with assigned products (atomic SetNull)...');
  await db.flavor.delete({
    where: { id: testFlavor.id },
  });

  const clearedProduct = await db.product.findUnique({
    where: { id: testProduct.id },
    include: { flavor: true },
  });

  if (clearedProduct.flavorId !== null || clearedProduct.flavor !== null) {
    throw new Error(`FAIL: Flavor deletion did not clear product flavorId! Got flavorId: ${clearedProduct.flavorId}`);
  }
  console.log(`✓ Flavor deletion SetNull verified! Product "${clearedProduct.name}" now has flavorId: null (no dangling reference, no error).`);

  // TEST 4: Flavor Deletion with zero product references
  console.log('\n[TEST 4] Testing Flavor deletion with 0 assigned products...');
  const unassignedFlavor = await db.flavor.create({
    data: { name: `UnassignedFlavor_${Date.now()}` },
  });
  await db.flavor.delete({
    where: { id: unassignedFlavor.id },
  });
  const deletedCheck = await db.flavor.findUnique({ where: { id: unassignedFlavor.id } });
  if (deletedCheck !== null) {
    throw new Error('FAIL: Unassigned flavor was not deleted!');
  }
  console.log('✓ Clean deletion of unassigned flavor verified!');

  // Cleanup temporary test product
  await db.product.delete({ where: { id: testProduct.id } });
  console.log('- Cleaned up temporary test product.');

  // TEST 5: Verify product count & existing active products
  const activeProducts = await db.product.findMany({
    where: { isDeleted: false },
    include: { flavor: true, category: true },
  });
  console.log(`\n[TEST 5] Current active products count: ${activeProducts.length}`);
  activeProducts.forEach((p) => {
    console.log(` - Product "${p.name}" | Category: "${p.category.name}" | Flavor: ${p.flavor ? `"${p.flavor.name}"` : 'None'}`);
  });

  console.log('\n====================================================');
  console.log('  ALL FIX-12 VERIFICATION TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================================');

  await db.$disconnect();
}

verifyFix12().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
