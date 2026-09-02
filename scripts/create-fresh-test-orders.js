const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFreshTestOrders() {
  console.log('====================================================');
  console.log('CREATING FRESH REAL TEST ORDERS (3 COMBINATIONS)');
  console.log('====================================================\n');

  try {
    // 1. Delete scratch/test orders created during verification tests if any
    const deleted = await prisma.order.deleteMany({
      where: {
        OR: [
          { receiptNumber: { startsWith: 'VERIFY-' } },
          { receiptNumber: { startsWith: 'FIX13-' } },
          { receiptNumber: { startsWith: 'INVTEST' } },
          { receiptNumber: { startsWith: 'PEND' } },
        ],
      },
    });
    console.log(`Cleaned up ${deleted.count} temporary scratch test order(s).\n`);

    const now = Date.now();

    // 2. Fresh Order 1: Both Phone Numbers AND Email Provided
    const order1 = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          receiptNumber: `AC-${now}-101`,
          customerName: 'Aarav Sharma',
          customerMobile: '9999900000',
          alternatePhone: '9876543211',
          customerEmail: 'aarav.sharma@example.com',
          shippingAddress: 'Flat 402, Sai Tower, LBS Marg, 12 Bakers Lane, Demo City',
          deliveryTimeSlot: '2-hours',
          specialInstructions: 'Please write Happy Birthday Aarav on cake',
          items: [
            {
              variantId: 'v-choc-1',
              productName: 'Belgian Chocolate Truffle Cake',
              variantLabel: '500g',
              quantity: 1,
              price: 550,
              itemTotal: 550,
            },
          ],
          totalAmount: 550.00,
          paymentStatus: 'SUCCESS',
          orderStatus: 'ORDER_RECEIVED',
          razorpayOrderId: `order_real_1_${now}`,
          razorpayPaymentId: `pay_real_1_${now}`,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: ord.id, status: 'ORDER_RECEIVED' },
      });

      // Notification outbox created because customerEmail exists
      await tx.notificationOutbox.create({
        data: {
          type: 'ORDER_CONFIRMATION_EMAIL',
          recipient: ord.customerEmail,
          status: 'SENT',
          payload: {
            orderId: ord.id,
            receiptNumber: ord.receiptNumber,
            customerName: ord.customerName,
            customerMobile: ord.customerMobile,
            totalAmount: Number(ord.totalAmount),
            items: ord.items,
          },
        },
      });

      return ord;
    });

    console.log('✅ FRESH TEST ORDER 1 CREATED (Both Phones + Email):');
    console.log(`   Receipt #: ${order1.receiptNumber}`);
    console.log(`   Customer: ${order1.customerName}`);
    console.log(`   Primary Phone: ${order1.customerMobile}`);
    console.log(`   Alternate Phone: ${order1.alternatePhone}`);
    console.log(`   Email: ${order1.customerEmail}\n`);

    // 3. Fresh Order 2: Primary Phone ONLY (No Email, No Alternate Phone)
    const order2 = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          receiptNumber: `AC-${now}-102`,
          customerName: 'Priya Patel',
          customerMobile: '9812345678',
          alternatePhone: null,
          customerEmail: null,
          shippingAddress: 'Building B, Room 102, Station Road, 12 Bakers Lane, Demo City',
          deliveryTimeSlot: '1-hour',
          specialInstructions: null,
          items: [
            {
              variantId: 'v-rv-1',
              productName: 'Royal Red Velvet Cake',
              variantLabel: '1kg',
              quantity: 1,
              price: 850,
              itemTotal: 850,
            },
          ],
          totalAmount: 850.00,
          paymentStatus: 'SUCCESS',
          orderStatus: 'ORDER_RECEIVED',
          razorpayOrderId: `order_real_2_${now}`,
          razorpayPaymentId: `pay_real_2_${now}`,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: ord.id, status: 'ORDER_RECEIVED' },
      });

      // No NotificationOutbox row created because customerEmail is null
      return ord;
    });

    console.log('✅ FRESH TEST ORDER 2 CREATED (Primary Phone Only, No Email):');
    console.log(`   Receipt #: ${order2.receiptNumber}`);
    console.log(`   Customer: ${order2.customerName}`);
    console.log(`   Primary Phone: ${order2.customerMobile}`);
    console.log(`   Alternate Phone: ${order2.alternatePhone || 'null'}`);
    console.log(`   Email: ${order2.customerEmail || 'null (No Outbox Row Created)'}\n`);

    // 4. Fresh Order 3: Alternate Phone Provided (No Email)
    const order3 = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          receiptNumber: `AC-${now}-103`,
          customerName: 'Vikram Mehta',
          customerMobile: '9988776655',
          alternatePhone: '9988776644',
          customerEmail: null,
          shippingAddress: 'Villa 12, MG Road, 12 Bakers Lane, Demo City',
          deliveryTimeSlot: '3-hours',
          specialInstructions: 'Ring doorbell twice upon arrival',
          items: [
            {
              variantId: 'v-pine-1',
              productName: 'Fresh Pineapple Delight',
              variantLabel: '500g',
              quantity: 1,
              price: 499,
              itemTotal: 499,
            },
          ],
          totalAmount: 499.00,
          paymentStatus: 'SUCCESS',
          orderStatus: 'ORDER_RECEIVED',
          razorpayOrderId: `order_real_3_${now}`,
          razorpayPaymentId: `pay_real_3_${now}`,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: ord.id, status: 'ORDER_RECEIVED' },
      });

      return ord;
    });

    console.log('✅ FRESH TEST ORDER 3 CREATED (Alternate Phone + No Email):');
    console.log(`   Receipt #: ${order3.receiptNumber}`);
    console.log(`   Customer: ${order3.customerName}`);
    console.log(`   Primary Phone: ${order3.customerMobile}`);
    console.log(`   Alternate Phone: ${order3.alternatePhone}`);
    console.log(`   Email: ${order3.customerEmail || 'null (No Outbox Row Created)'}\n`);

    console.log('====================================================');
    console.log('3 FRESH REAL TEST ORDERS VERIFIED IN POSTGRESQL DB');
    console.log('====================================================');
  } catch (err) {
    console.error('Error creating fresh test orders:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFreshTestOrders();
