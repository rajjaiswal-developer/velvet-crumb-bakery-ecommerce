const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function debugCategories() {
  console.log('=== DEBUGGING CATEGORIES & PRODUCTS ===\n');

  const categories = await db.category.findMany({
    include: {
      products: true,
    },
  });

  console.log(`Total Categories found: ${categories.length}`);
  for (const cat of categories) {
    console.log(`- Category ID: "${cat.id}", Name: "${cat.name}", Slug: "${cat.slug}", Type: "${cat.type}"`);
    console.log(`  Products count: ${cat.products.length}`);
    for (const p of cat.products) {
      console.log(`    * Product: "${p.name}", Slug: "${p.slug}", isActive: ${p.isActive}, isDeleted: ${p.isDeleted}`);
    }
  }

  const allProducts = await db.product.findMany({
    include: { category: true },
  });
  console.log(`\nTotal Products in DB: ${allProducts.length}`);
  for (const p of allProducts) {
    console.log(`- Product: "${p.name}", categoryId: "${p.categoryId}", Category Name: "${p.category?.name}", Category Slug: "${p.category?.slug}"`);
  }

  await db.$disconnect();
}

debugCategories().catch(console.error);
