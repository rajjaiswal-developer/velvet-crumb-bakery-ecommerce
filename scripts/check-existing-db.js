const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function inspectDb() {
  console.log('=== CURRENT DATABASE INVENTORY AUDIT ===\n');

  const categories = await db.category.findMany({
    include: { products: true },
  });

  console.log(`Categories (${categories.length}):`);
  for (const c of categories) {
    console.log(`- ID: ${c.id} | Name: "${c.name}" | Slug: "${c.slug}" | Type: ${c.type} | Products: ${c.products.length}`);
  }

  const products = await db.product.findMany({
    include: { category: true, variants: true },
  });

  console.log(`\nProducts (${products.length}):`);
  for (const p of products) {
    console.log(`- ID: ${p.id} | Name: "${p.name}" | Category: "${p.category?.name}" (${p.categoryId}) | Deleted: ${p.isDeleted} | Variants: ${p.variants.length}`);
  }

  await db.$disconnect();
}

inspectDb().catch(console.error);
