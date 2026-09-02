const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function measureLatency() {
  console.log('=== BENCHMARKING DATABASE & API LATENCY ===\n');

  // Cold start connection setup
  const coldStart = performance.now();
  await db.$connect();
  const coldTime = (performance.now() - coldStart).toFixed(2);
  console.log(`0. Cold TCP+TLS Pool Connection Setup: ${coldTime} ms\n`);

  // Test 1: Admin Orders Query (Warm pooled connection)
  const startOrders = performance.now();
  const orders = await db.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { history: true },
  });
  const ordersTime = (performance.now() - startOrders).toFixed(2);
  console.log(`1. Admin Orders List Query (Warm pooled - ${orders.length} items): ${ordersTime} ms`);

  // Repeat Admin Orders Query to measure pooled reuse latency
  const startOrders2 = performance.now();
  await db.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { history: true },
  });
  const ordersTime2 = (performance.now() - startOrders2).toFixed(2);
  console.log(`   - Second execution (Reused pool connection): ${ordersTime2} ms`);

  // Test 2: Product List Query
  const startProducts = performance.now();
  const products = await db.product.findMany({
    where: { isDeleted: false },
    include: { category: true, variants: true },
    orderBy: { createdAt: 'desc' },
  });
  const productsTime = (performance.now() - startProducts).toFixed(2);
  console.log(`\n2. Product List Query (Warm pooled - ${products.length} items): ${productsTime} ms`);

  // Test 3: Cart Items Resolution (Sequential N+1 vs Batched Single Query)
  const sampleVariants = await db.variant.findMany({ take: 5 });
  const variantIds = sampleVariants.map((v) => v.id);

  const startCartSequential = performance.now();
  for (const id of variantIds) {
    await db.variant.findUnique({ where: { id }, include: { product: true } });
  }
  const sequentialTime = (performance.now() - startCartSequential).toFixed(2);

  const startCartBatched = performance.now();
  await db.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const batchedTime = (performance.now() - startCartBatched).toFixed(2);

  console.log(`\n3. Cart Item Resolution Benchmark (5 items):`);
  console.log(`   - Sequential (N+1 roundtrips): ${sequentialTime} ms`);
  console.log(`   - Batched (Single query): ${batchedTime} ms (Speedup: ${(sequentialTime / batchedTime).toFixed(1)}x faster)`);

  console.log('\n===========================================');
  await db.$disconnect();
}

measureLatency().catch((err) => {
  console.error(err);
  db.$disconnect();
  process.exit(1);
});
