const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany({
    include: { variants: true, category: true }
  });
  console.log('Total products in DB:', products.length);
  for (const p of products) {
    console.log('----------------------------------------');
    console.log('ID:', p.id);
    console.log('Name:', p.name);
    console.log('Slug:', p.slug);
    console.log('Description:', p.description);
    console.log('Images:', JSON.stringify(p.images));
    console.log('isDeleted:', p.isDeleted);
  }
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
