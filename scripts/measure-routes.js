const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runRouteBenchmarks() {
  console.log('=== ROUTE QUERY TIMING BENCHMARK ===\n');

  // Benchmark 1: GET /api/admin/orders logic
  console.log('1. Measuring GET /api/admin/orders query timing...');
  const t0 = performance.now();
  const orders = await db.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { history: { orderBy: { changedAt: 'asc' } } },
  });
  const t1 = performance.now();
  console.log(`   - Time taken: ${(t1 - t0).toFixed(2)} ms (${orders.length} orders fetched)`);

  // Benchmark 2: GET /api/admin/products logic
  console.log('\n2. Measuring GET /api/admin/products query timing...');
  const t2 = performance.now();
  const products = await db.product.findMany({
    where: { isDeleted: false },
    include: { category: true, variants: true },
    orderBy: { createdAt: 'desc' },
  });
  const t3 = performance.now();
  console.log(`   - Time taken: ${(t3 - t2).toFixed(2)} ms (${products.length} products fetched)`);

  await db.$disconnect();
}

runRouteBenchmarks().catch(console.error);
