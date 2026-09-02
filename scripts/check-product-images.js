const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkImages() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      isDeleted: true,
    },
  });

  console.log(`Total products in DB: ${products.length}\n`);
  for (const p of products) {
    console.log(`Product: "${p.name}" (ID: ${p.id}, Slug: ${p.slug}, Deleted: ${p.isDeleted})`);
    console.log(`  Raw images field:`, JSON.stringify(p.images));
    console.log(`  Type of images field:`, typeof p.images, Array.isArray(p.images) ? 'Array' : 'Not Array');
    console.log('---');
  }

  await db.$disconnect();
}

checkImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
