const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFICATION FOR FIX-13: EMAIL NOT SENDING RESOLUTION');
  console.log('====================================================\n');

  // 1. Audit Existing Outbox Row for Real Test Order
  console.log('1. Auditing NotificationOutbox record for real test order AC-1785048047785-457...');
  const outboxRow = await prisma.notificationOutbox.findUnique({
    where: { id: '3cd57862-b1a2-4912-b866-9dcd37b0c62b' },
  });

  if (!outboxRow) {
    throw new Error('FAILURE: Outbox row 3cd57862-b1a2-4912-b866-9dcd37b0c62b not found');
  }

  console.log(`   Outbox Row ID: ${outboxRow.id}`);
  console.log(`   Recipient: ${outboxRow.recipient}`);
  console.log(`   Status: ${outboxRow.status}`);
  console.log(`   Last Error: ${outboxRow.lastError || 'None (Cleared)'}`);

  if (outboxRow.status !== 'SENT') {
    throw new Error(`FAILURE: Outbox row status is ${outboxRow.status}, expected SENT`);
  }
  console.log('   PASSED: Real test order outbox row successfully transitioned to SENT status!\n');

  // 2. Create Genuinely New Test Order & Trigger Outbox Pipeline
  console.log('2. Creating genuinely new test order to verify end-to-end outbox pipeline...');
  const testReceipt = `FIX13-${Date.now().toString().slice(-6)}`;
  const testEmail = 'test@example.com';

  const newOrder = await prisma.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'Test Customer (Fix 13 E2E Test)',
      customerMobile: '9999900000',
      customerEmail: testEmail,
      shippingAddress: 'Sunder Baug, NSS Road, Asalpha, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: 'Within 2 Hours',
      specialInstructions: 'Fix 13 Email Delivery Verification Test Order',
      items: [
        {
          productName: 'Belgian Chocolate Truffle Cake',
          variantLabel: '500g',
          quantity: 1,
          price: 500,
          itemTotal: 500,
        },
      ],
      totalAmount: 500,
      orderStatus: 'ORDER_RECEIVED',
      paymentStatus: 'SUCCESS',
      razorpayOrderId: `order_fix13_${Date.now()}`,
      razorpayPaymentId: `pay_fix13_${Date.now()}`,
    },
  });

  console.log(`   Created test order ID: ${newOrder.id} (Receipt #: ${testReceipt})`);

  // 3. Create NotificationOutbox Row (Simulating Webhook Transaction)
  console.log('\n3. Creating NotificationOutbox row for new order...');
  const newOutboxRow = await prisma.notificationOutbox.create({
    data: {
      type: 'ORDER_CONFIRMATION_EMAIL',
      recipient: testEmail,
      payload: {
        orderId: newOrder.id,
        receiptNumber: testReceipt,
        customerName: newOrder.customerName,
        customerMobile: newOrder.customerMobile,
        totalAmount: Number(newOrder.totalAmount),
        items: newOrder.items,
        shippingAddress: newOrder.shippingAddress,
        deliveryTimeSlot: newOrder.deliveryTimeSlot,
        specialInstructions: newOrder.specialInstructions,
      },
    },
  });

  console.log(`   Created outbox row ID: ${newOutboxRow.id}`);

  // 4. Process Outbox Row via Brevo Sender
  console.log('\n4. Processing outbox row via Brevo REST API...');
  const { processOutboxRow } = require('../lib/notifications/outbox');
  const processResult = await processOutboxRow(newOutboxRow.id);

  console.log('   Process Result:', processResult);

  if (!processResult.success) {
    throw new Error(`FAILURE: Outbox processing failed: ${processResult.error}`);
  }

  // 5. Verify Database Outbox Status
  console.log('\n5. Verifying database outbox status after Brevo dispatch...');
  const finalOutboxRow = await prisma.notificationOutbox.findUnique({
    where: { id: newOutboxRow.id },
  });

  console.log(`   Final Outbox Status: ${finalOutboxRow.status}`);
  console.log(`   Final Outbox Error: ${finalOutboxRow.lastError || 'None'}`);

  if (finalOutboxRow.status !== 'SENT') {
    throw new Error(`FAILURE: Outbox status was not updated to SENT. Got: ${finalOutboxRow.status}`);
  }
  console.log('   PASSED: New test order outbox record successfully processed and sent!\n');

  // 6. Cleanup Verification Test Order & Outbox Row
  console.log('6. Cleaning up verification test data...');
  await prisma.notificationOutbox.delete({ where: { id: newOutboxRow.id } });
  await prisma.order.delete({ where: { id: newOrder.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('====================================================');
  console.log('ALL FIX-13 VERIFICATION CHECKS PASSED SUCCESSFULLY');
  console.log('====================================================');
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
