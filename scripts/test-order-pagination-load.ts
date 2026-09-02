import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('=== STARTING SAFE SYNTHETIC LOAD TEST ===');
  const timestamp = Date.now();
  const COUNT = 500;

  console.log(`1. Seeding ${COUNT} synthetic LOADTEST orders into database...`);
  const syntheticOrders = [];
  for (let i = 0; i < COUNT; i++) {
    syntheticOrders.push({
      receiptNumber: `AC-LOADTEST-${timestamp}-${i}`,
      customerName: `LOADTEST-USER-${i}`,
      customerMobile: `9800${String(i).padStart(6, '0')}`,
      alternatePhone: null,
      customerEmail: `loadtest_${i}@example.com`,
      shippingAddress: `Flat ${i}, Load Test Residency, 12 Bakers Lane, Demo City`,
      deliveryTimeSlot: '12:00 PM - 03:00 PM',
      specialInstructions: 'Synthetic load test order - auto cleanup',
      items: [
        {
          productId: 'loadtest-prod-1',
          variantId: 'loadtest-var-1',
          productName: 'Load Test Cake',
          variantLabel: '500g',
          quantity: 1,
          price: 500,
        },
      ],
      totalAmount: 500,
      paymentStatus: 'SUCCESS' as const,
      orderStatus: 'ORDER_RECEIVED' as const,
      createdAt: new Date(timestamp - (COUNT - i) * 60000), // Spaced by 1 min
    });
  }

  // Insert in batches of 100 for fast seeding
  for (let i = 0; i < syntheticOrders.length; i += 100) {
    const batch = syntheticOrders.slice(i, i + 100);
    await db.order.createMany({ data: batch });
  }
  console.log(`✓ ${COUNT} synthetic orders seeded successfully.`);

  // Measure 1: Unpaginated fetch baseline
  console.log('\n2. Benchmarking Unpaginated Fetch vs Paginated Fetch vs Lightweight Poll...');

  const startUnpaginated = performance.now();
  const unpaginatedResult = await db.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
  });
  const durationUnpaginated = performance.now() - startUnpaginated;
  const sizeUnpaginated = Buffer.byteLength(JSON.stringify(unpaginatedResult), 'utf8');

  // Measure 2: Paginated fetch (page 1, 25 rows)
  const startPaginated = performance.now();
  const [totalCount, paginatedOrders] = await Promise.all([
    db.order.count({ where: { paymentStatus: 'SUCCESS' } }),
    db.order.findMany({
      where: { paymentStatus: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 25,
    }),
  ]);
  const durationPaginated = performance.now() - startPaginated;
  const paginatedResponsePayload = {
    success: true,
    data: paginatedOrders,
    pagination: { page: 1, pageSize: 25, total: totalCount, totalPages: Math.ceil(totalCount / 25) },
  };
  const sizePaginated = Buffer.byteLength(JSON.stringify(paginatedResponsePayload), 'utf8');

  // Measure 3: Lightweight Poll check
  const startPoll = performance.now();
  const sinceDate = new Date(timestamp - 5 * 60000); // 5 mins ago
  const [newPaidOrders, latestOrder] = await Promise.all([
    db.order.findMany({
      where: { paymentStatus: 'SUCCESS', createdAt: { gt: sinceDate } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.order.findFirst({ select: { updatedAt: true }, orderBy: { updatedAt: 'desc' } }),
  ]);
  const durationPoll = performance.now() - startPoll;
  const pollPayload = {
    success: true,
    newPaidOrderIds: newPaidOrders.map((o) => o.id),
    hasChanges: newPaidOrders.length > 0 || (latestOrder?.updatedAt ? latestOrder.updatedAt > sinceDate : false),
    timestamp: new Date().toISOString(),
  };
  const sizePoll = Buffer.byteLength(JSON.stringify(pollPayload), 'utf8');

  console.log('\n=== BENCHMARK EVIDENCE RESULTS ===');
  console.log(`Unpaginated Full Table Fetch:`);
  console.log(`  - Returned Rows: ${unpaginatedResult.length}`);
  console.log(`  - DB Query Time: ${durationUnpaginated.toFixed(2)} ms`);
  console.log(`  - Payload Size: ${(sizeUnpaginated / 1024).toFixed(2)} KB (${sizeUnpaginated} bytes)`);

  console.log(`\nPaginated Fetch (Page 1, 25 items):`);
  console.log(`  - Total Rows: ${totalCount}, Returned: ${paginatedOrders.length}`);
  console.log(`  - DB Query Time: ${durationPaginated.toFixed(2)} ms`);
  console.log(`  - Payload Size: ${(sizePaginated / 1024).toFixed(2)} KB (${sizePaginated} bytes)`);

  console.log(`\nSingle Lightweight Poll Check:`);
  console.log(`  - DB Query Time: ${durationPoll.toFixed(2)} ms`);
  console.log(`  - Payload Size: ${(sizePoll / 1024).toFixed(2)} KB (${sizePoll} bytes)`);

  console.log(`\n=== CONSOLIDATED POLLING COMPARISON ===`);
  console.log(`Before (2 full unpaginated fetches per 12s poll): 2 requests, ~${((sizeUnpaginated * 2) / 1024).toFixed(2)} KB transferred per poll`);
  console.log(`After (1 lightweight check per 12s poll): 1 request, ~${(sizePoll / 1024).toFixed(2)} KB transferred per poll`);
  console.log(`Payload Reduction Ratio: ${(sizeUnpaginated / sizePoll).toFixed(1)}x smaller payload!`);

  // Step 4: Cleanup
  console.log('\n3. Cleaning up all synthetic LOADTEST test orders...');
  const deleteResult = await db.order.deleteMany({
    where: {
      OR: [
        { receiptNumber: { startsWith: 'AC-LOADTEST-' } },
        { customerName: { startsWith: 'LOADTEST-' } },
      ],
    },
  });
  console.log(`✓ Deleted ${deleteResult.count} synthetic test orders.`);

  // Step 5: Verification of 0 remaining
  const remainingCount = await db.order.count({
    where: {
      OR: [
        { receiptNumber: { startsWith: 'AC-LOADTEST-' } },
        { customerName: { startsWith: 'LOADTEST-' } },
      ],
    },
  });

  console.log(`\n4. Post-cleanup database verification:`);
  console.log(`   LOADTEST rows remaining in database: ${remainingCount}`);

  if (remainingCount === 0) {
    console.log('SUCCESS: 100% of synthetic test data has been verified completely cleaned up!');
  } else {
    console.error(`ERROR: ${remainingCount} synthetic test rows remain!`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Error during load test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
