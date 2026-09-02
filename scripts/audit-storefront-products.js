const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditStorefront() {
  console.log('=== STOREFRONT PRODUCTS & CATEGORY MAPPING AUDIT ===\n');

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      variants: true,
    },
  });

  console.log(`Total Active Products in Database: ${products.length}\n`);

  for (const p of products) {
    console.log(`Product: "${p.name}" (Slug: ${p.slug})`);
    console.log(`- Category Name: "${p.category?.name}" (ID: ${p.categoryId})`);
    console.log(`- Is Subcategory?: ${p.category?.parentId ? 'YES' : 'NO (Top-Level)'}`);
    if (p.category?.parent) {
      console.log(`- Parent Category: "${p.category.parent.name}" (Slug: ${p.category.parent.slug})`);
    } else {
      console.log(`- Parent Category: NONE`);
    }
    console.log(`- Variants Count: ${p.variants.length}`);
    console.log(`- Storefront Path: /categories/${p.category?.parent?.slug || p.category?.slug} -> /categories/${p.category?.slug}\n`);
  }

  await prisma.$disconnect();
}

auditStorefront().catch(console.error);
