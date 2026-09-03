const { getCachedPublicProducts, getCachedPublicCategories } = require('../lib/cache');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- DIRECT PRISMA QUERY ---');
  const directProducts = await prisma.product.findMany({
    where: { isDeleted: false, isActive: true },
    include: { category: { include: { parent: true } }, flavor: true, variants: true }
  });
  console.log(`Direct active products count: ${directProducts.length}`);

  console.log('--- UNSTABLE CACHE QUERY ---');
  const cachedProducts = await getCachedPublicProducts();
  console.log(`Cached public products count: ${cachedProducts.length}`);

  await prisma.$disconnect();
}

run().catch(console.error);
