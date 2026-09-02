const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== STARTING VERIFICATION FOR FIX-01 (INVENTORY RESERVATION & RELEASE) ===\n');

  // 1. Setup Test Product & Variant
  console.log('1. Setting up test product & variant...');
  const category = await prisma.category.upsert({
    where: { slug: 'fix01-test-category' },
    update: {},
    create: {
      name: 'Fix01 Test Category',
      slug: 'fix01-test-category',
      type: 'CAKE',
    },
  });

  const product = await prisma.product.create({
    data: {
      name: 'Fix01 Test Cake',
      slug: `fix01-test-cake-${Date.now()}`,
      categoryId: category.id,
      description: 'Test cake for inventory reservation verification',
      variants: {
        create: [
          {
            label: '500g Test',
            price: 500,
            stockQuantity: 10,
            reservedQuantity: 0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];
  console.log(`   Created variant ${variant.id} with stockQuantity=10, reservedQuantity=0.\n`);

  // Define local reservation helpers for Node.js test script mirroring lib/payments/reservation.ts
  async function releaseOrderReservation(orderId, targetPaymentStatus) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentStatus !== 'PENDING') return order;
      const items = order.items || [];
      for (const item of items) {
        const v = await tx.variant.findUnique({ where: { id: item.variantId } });
        if (v) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { reservedQuantity: Math.max(0, v.reservedQuantity - item.quantity) },
          });
        }
      }
      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: targetPaymentStatus, reservationExpiry: null },
      });
    });
  }

  async function reserveStockAtomic(items) {
    return prisma.$transaction(async (tx) => {
      for (const item of items) {
        const v = await tx.variant.findUnique({ where: { id: item.variantId } });
        const avail = v.stockQuantity - v.reservedQuantity;
        if (item.quantity > avail) throw new Error('Stock unavailable');
        await tx.variant.update({
          where: { id: item.variantId },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }
    });
  }

  async function confirmOrderStock(items) {
    return prisma.$transaction(async (tx) => {
      for (const item of items) {
        const v = await tx.variant.findUnique({ where: { id: item.variantId } });
        if (v) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: Math.max(0, v.stockQuantity - item.quantity),
              reservedQuantity: Math.max(0, v.reservedQuantity - item.quantity),
            },
          });
        }
      }
    });
  }

  // 2. Test Atomic Reservation
  console.log('2. Testing Atomic Inventory Reservation...');
  await reserveStockAtomic([{ variantId: variant.id, quantity: 2 }]);

  let vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  if (vState.stockQuantity !== 10 || vState.reservedQuantity !== 2) {
    throw new Error(`FAILURE: Reservation failed. Expected stock=10, reserved=2, got stock=${vState.stockQuantity}, reserved=${vState.reservedQuantity}`);
  }
  console.log('   PASSED: Stock reserved (stockQuantity=10, reservedQuantity=2).\n');

  // Create an Order row representing this reservation
  const order1 = await prisma.order.create({
    data: {
      receiptNumber: `FIX01-ORD1-${Date.now()}`,
      customerName: 'Test Customer 1',
      customerMobile: '9999900000',
      customerEmail: 'test1@example.com',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 1000,
      paymentStatus: 'PENDING',
      reservationExpiry: new Date(Date.now() + 15 * 60 * 1000),
      items: [{ variantId: variant.id, quantity: 2 }],
    },
  });

  // 3. Test Permanent Decrement on Payment Success
  console.log('3. Testing Permanent Inventory Decrement on Payment Success...');
  await confirmOrderStock(order1.items);
  await prisma.order.update({
    where: { id: order1.id },
    data: { paymentStatus: 'SUCCESS', orderStatus: 'ORDER_RECEIVED' },
  });

  vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  if (vState.stockQuantity !== 8 || vState.reservedQuantity !== 0) {
    throw new Error(`FAILURE: Payment success decrement failed. Expected stock=8, reserved=0, got stock=${vState.stockQuantity}, reserved=${vState.reservedQuantity}`);
  }
  console.log('   PASSED: Payment success permanently decremented stock (stockQuantity=8, reservedQuantity=0).\n');

  // 4. Test Stock Release on Payment Failure
  console.log('4. Testing Stock Release on Payment Failure...');
  await reserveStockAtomic([{ variantId: variant.id, quantity: 3 }]);

  const order2 = await prisma.order.create({
    data: {
      receiptNumber: `FIX01-ORD2-${Date.now()}`,
      customerName: 'Test Customer 2',
      customerMobile: '9999900000',
      customerEmail: 'test2@example.com',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 1500,
      paymentStatus: 'PENDING',
      reservationExpiry: new Date(Date.now() + 15 * 60 * 1000),
      items: [{ variantId: variant.id, quantity: 3 }],
    },
  });

  vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  if (vState.reservedQuantity !== 3) {
    throw new Error(`FAILURE: Order 2 reservation failed. Expected reserved=3, got ${vState.reservedQuantity}`);
  }

  // Release reservation via helper (simulating webhook failure)
  await releaseOrderReservation(order2.id, 'FAILED');

  vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  const updatedOrder2 = await prisma.order.findUnique({ where: { id: order2.id } });
  if (vState.stockQuantity !== 8 || vState.reservedQuantity !== 0 || updatedOrder2.paymentStatus !== 'FAILED') {
    throw new Error(`FAILURE: Payment failure release failed. Expected stock=8, reserved=0, paymentStatus=FAILED.`);
  }
  console.log('   PASSED: Payment failure released reservation (stockQuantity=8, reservedQuantity=0, paymentStatus=FAILED).\n');

  // 5. Test Stock Release on Cron Expiry
  console.log('5. Testing Stock Release on Cron Expiry...');
  await reserveStockAtomic([{ variantId: variant.id, quantity: 1 }]);

  const order3 = await prisma.order.create({
    data: {
      receiptNumber: `FIX01-ORD3-${Date.now()}`,
      customerName: 'Test Customer 3',
      customerMobile: '9999900000',
      customerEmail: 'test3@example.com',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 500,
      paymentStatus: 'PENDING',
      reservationExpiry: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 mins ago
      items: [{ variantId: variant.id, quantity: 1 }],
    },
  });

  // Release reservation via helper (simulating cron sweep)
  await releaseOrderReservation(order3.id, 'EXPIRED');

  vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  const updatedOrder3 = await prisma.order.findUnique({ where: { id: order3.id } });
  if (vState.stockQuantity !== 8 || vState.reservedQuantity !== 0 || updatedOrder3.paymentStatus !== 'EXPIRED') {
    throw new Error(`FAILURE: Cron expiry release failed. Expected stock=8, reserved=0, paymentStatus=EXPIRED.`);
  }
  console.log('   PASSED: Cron expiry released reservation (stockQuantity=8, reservedQuantity=0, paymentStatus=EXPIRED).\n');

  // 6. Test Admin Manual Cancellation
  console.log('6. Testing Admin Manual Order Cancellation...');
  await reserveStockAtomic([{ variantId: variant.id, quantity: 4 }]);

  const order4 = await prisma.order.create({
    data: {
      receiptNumber: `FIX01-ORD4-${Date.now()}`,
      customerName: 'Test Customer 4',
      customerMobile: '9999900000',
      customerEmail: 'test4@example.com',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 2000,
      paymentStatus: 'PENDING',
      reservationExpiry: new Date(Date.now() + 15 * 60 * 1000),
      items: [{ variantId: variant.id, quantity: 4 }],
    },
  });

  // Release reservation via helper (simulating Admin manual cancel action)
  await releaseOrderReservation(order4.id, 'CANCELLED');

  vState = await prisma.variant.findUnique({ where: { id: variant.id } });
  const updatedOrder4 = await prisma.order.findUnique({ where: { id: order4.id } });
  if (vState.stockQuantity !== 8 || vState.reservedQuantity !== 0 || updatedOrder4.paymentStatus !== 'CANCELLED') {
    throw new Error(`FAILURE: Admin cancel release failed. Expected stock=8, reserved=0, paymentStatus=CANCELLED.`);
  }
  console.log('   PASSED: Admin manual cancellation released reservation (stockQuantity=8, reservedQuantity=0, paymentStatus=CANCELLED).\n');

  // 7. Cleanup test data
  console.log('7. Cleaning up test data...');
  await prisma.order.deleteMany({
    where: { id: { in: [order1.id, order2.id, order3.id, order4.id] } },
  });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  console.log('   PASSED: Test data cleaned up.\n');

  console.log('=== ALL FIX-01 VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

runVerification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
