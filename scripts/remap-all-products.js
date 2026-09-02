const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remapAllProducts() {
  console.log('=== RE-MAPPING ALL PRODUCTS TO SUBCATEGORIES ===\n');

  // Find Birthday Cakes subcategory
  const birthdaySub = await prisma.category.findUnique({
    where: { slug: 'birthday-cakes' },
  });

  if (!birthdaySub) {
    throw new Error('Birthday Cakes subcategory not found!');
  }

  // Find any products attached to flat/test categories (like Fix01 Test Category)
  const flatProducts = await prisma.product.findMany({
    where: {
      category: {
        parentId: null,
        slug: { notIn: ['cakes', 'celebration'] },
      },
    },
    include: { category: true },
  });

  console.log(`Found ${flatProducts.length} test/flat products requiring subcategory remapping.`);

  for (const p of flatProducts) {
    console.log(`- Re-mapping product "${p.name}" (ID: ${p.id}) from "${p.category?.name}" to "Birthday Cakes"`);
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: birthdaySub.id },
    });
  }

  // Delete leftover test category if empty
  await prisma.category.deleteMany({
    where: {
      slug: 'fix01-test-category',
      products: { none: {} },
      children: { none: {} },
    },
  });

  console.log('\n=== RE-MAPPING COMPLETE. AUDITING RESULT ===\n');

  const allProducts = await prisma.product.findMany({
    where: { isDeleted: false },
    include: {
      category: {
        include: { parent: true },
      },
    },
  });

  for (const p of allProducts) {
    console.log(`Product: "${p.name}"`);
    console.log(`  Subcategory: "${p.category?.name}" (${p.category?.slug})`);
    console.log(`  Parent Category: "${p.category?.parent?.name}" (${p.category?.parent?.slug})`);
    console.log(`  Storefront Navigation: /categories/${p.category?.parent?.slug} -> /categories/${p.category?.slug}\n`);
  }

  await prisma.$disconnect();
}

remapAllProducts().catch(console.error);
