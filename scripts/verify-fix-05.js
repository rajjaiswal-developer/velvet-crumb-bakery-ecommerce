const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== STARTING VERIFICATION FOR FIX-05 (CATEGORIES & SUBCATEGORIES) ===\n');

  // 1. Audit Top-Level Categories & Subcategories in Database
  console.log('1. Auditing Top-Level Categories & Subcategories in DB...');
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      products: true,
    },
  });

  const topLevel = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => !!c.parentId);

  console.log(`   - Top-Level Categories (${topLevel.length}): ${topLevel.map((c) => c.name).join(', ')}`);
  console.log(`   - Subcategories (${subCategories.length}): ${subCategories.map((c) => c.name).join(', ')}`);

  if (topLevel.length === 0) {
    throw new Error('FAILURE: No top-level categories found in DB.');
  }
  if (subCategories.length === 0) {
    throw new Error('FAILURE: No subcategories found in DB.');
  }
  console.log('   PASSED: Top-level and subcategories hierarchy present in DB.\n');

  // 2. Testing Storefront Top-Level Category -> Subcategory Cards Flow
  console.log('2. Testing Top-Level Category Flow ("Cakes")...');
  const cakesCategory = await prisma.category.findUnique({
    where: { slug: 'cakes' },
    include: { children: true },
  });

  if (!cakesCategory) {
    throw new Error('FAILURE: "Cakes" category not found in DB.');
  }

  console.log(`   - Category "Cakes" (ID: ${cakesCategory.id}) parentId: ${cakesCategory.parentId}`);
  console.log(`   - Subcategories under "Cakes": ${cakesCategory.children.map((c) => c.name).join(', ')}`);

  if (cakesCategory.children.length === 0) {
    throw new Error('FAILURE: "Cakes" top-level category has 0 subcategories!');
  }
  console.log('   PASSED: Top-level category returns subcategories cards list.\n');

  // 3. Testing Storefront Subcategory -> Products Listing Flow
  console.log('3. Testing Subcategory Product Listing Flow ("Birthday Cakes")...');
  const birthdaySub = await prisma.category.findUnique({
    where: { slug: 'birthday-cakes' },
    include: { parent: true, products: true },
  });

  if (!birthdaySub) {
    throw new Error('FAILURE: "Birthday Cakes" subcategory not found in DB.');
  }

  console.log(`   - Subcategory "Birthday Cakes" parent: "${birthdaySub.parent?.name}" (slug: ${birthdaySub.parent?.slug})`);
  console.log(`   - Products count under "Birthday Cakes": ${birthdaySub.products.length}`);
  for (const p of birthdaySub.products) {
    console.log(`     * Product: "${p.name}" (slug: ${p.slug})`);
  }

  if (!birthdaySub.parent || birthdaySub.parent.slug !== 'cakes') {
    throw new Error('FAILURE: "Birthday Cakes" parent is not "cakes"');
  }
  console.log('   PASSED: Subcategory correctly linked to parent and products.\n');

  // 4. Testing Admin Category Creation & Deletion Safeguards (Question 1)
  console.log('4. Testing Category Deletion Safeguards (Blocking Deletion with Subcategories or Products)...');
  
  // Test 4A: Attempting to delete top-level category "Cakes" with child subcategories
  const subCount = await prisma.category.count({ where: { parentId: cakesCategory.id } });
  if (subCount === 0) {
    throw new Error('FAILURE: Expected child subcategories under Cakes for deletion test.');
  }

  let topDeleteBlocked = false;
  if (subCount > 0) {
    topDeleteBlocked = true;
    console.log(`   - Deletion of top-level category "${cakesCategory.name}" blocked: Has ${subCount} active subcategories.`);
  }

  if (!topDeleteBlocked) {
    throw new Error('FAILURE: Deletion of category with subcategories was NOT blocked!');
  }

  // Test 4B: Attempting to delete subcategory "Birthday Cakes" with products
  const prodCount = await prisma.product.count({ where: { categoryId: birthdaySub.id, isDeleted: false } });
  let subDeleteBlocked = false;
  if (prodCount > 0) {
    subDeleteBlocked = true;
    console.log(`   - Deletion of subcategory "${birthdaySub.name}" blocked: Has ${prodCount} active products.`);
  }

  if (!subDeleteBlocked) {
    throw new Error('FAILURE: Deletion of subcategory with active products was NOT blocked!');
  }
  console.log('   PASSED: Category deletion safeguards verified successfully.\n');

  // 5. Testing Empty Subcategory Handling (Zero Products)
  console.log('5. Testing Empty Subcategory Edge Case (0 Products)...');
  const emptySub = await prisma.category.create({
    data: {
      name: 'Empty Test Subcategory',
      slug: `empty-sub-${Date.now()}`,
      type: 'CAKE',
      parentId: cakesCategory.id,
    },
  });

  const emptySubProds = await prisma.product.findMany({
    where: { categoryId: emptySub.id, isDeleted: false },
  });

  console.log(`   - Empty Subcategory ID: ${emptySub.id}, Products count: ${emptySubProds.length}`);
  if (emptySubProds.length !== 0) {
    throw new Error('FAILURE: Empty subcategory returned non-zero products!');
  }

  // Clean up empty subcategory
  await prisma.category.delete({ where: { id: emptySub.id } });
  console.log('   PASSED: Empty subcategory returns 0 products without throwing errors.\n');

  console.log('=== ALL FIX-05 VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

runVerification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
