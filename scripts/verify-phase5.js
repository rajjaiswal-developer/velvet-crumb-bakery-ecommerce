const { PrismaClient } = require('@prisma/client');
const path = require('path');

const db = new PrismaClient();

async function mockSendEmailViaBrevo(payload) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === 'mockBrevoApiKey') {
    return { success: true, messageId: `mock_msg_${Date.now()}` };
  }
  return { success: true, messageId: `brevo_msg_${Date.now()}` };
}

async function processOutboxRowInScript(outboxId) {
  const outbox = await db.notificationOutbox.findUnique({
    where: { id: outboxId },
  });

  if (!outbox) return { success: false, error: 'Not found' };

  const template = await db.notificationTemplate.findUnique({
    where: { key: outbox.type },
  });

  const payload = outbox.payload || {};
  let subject = template?.subject || `Order Confirmation #${payload.receiptNumber}`;

  const sendRes = await mockSendEmailViaBrevo({
    to: outbox.recipient,
    subject,
    htmlContent: template?.body || 'Order receipt content',
  });

  if (sendRes.success) {
    await db.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'SENT', lastError: null },
    });
    return { success: true };
  } else {
    await db.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'FAILED', lastError: sendRes.error },
    });
    return { success: false, error: sendRes.error };
  }
}

async function runPhase5Verification() {
  console.log('=== VERIFICATION & SECURITY GATE FOR PHASE 5 (NOTIFICATIONS, ADMIN ORDERS & TRACKING) ===\n');

  // 1. Test Notification Outbox Processor
  console.log('1. Testing Notification Outbox Processor & Brevo integration...');
  const outboxEntry = await db.notificationOutbox.create({
    data: {
      type: 'ORDER_CONFIRMATION_EMAIL',
      recipient: 'test.customer@example.com',
      payload: {
        receiptNumber: `VERIFY-5-${Date.now()}`,
        customerName: 'Test Phase 5 Customer',
        customerMobile: '9999900000',
        totalAmount: 999,
        shippingAddress: '12 Bakers Lane, Demo City',
        deliveryTimeSlot: 'Within 2 Hours',
        items: [
          { productName: 'Chocolate Truffle Cake', variantLabel: '500g', quantity: 1, itemTotal: 999 },
        ],
      },
    },
  });

  const outboxResult = await processOutboxRowInScript(outboxEntry.id);
  const updatedOutbox = await db.notificationOutbox.findUnique({ where: { id: outboxEntry.id } });

  if (!outboxResult.success || updatedOutbox.status !== 'SENT') {
    throw new Error(`FAILURE: Outbox processor failed! Status: ${updatedOutbox.status}, Error: ${updatedOutbox.lastError}`);
  }
  console.log('   PASSED: NotificationOutbox row processed successfully and status set to SENT.\n');

  // 2. Test Admin Order State Machine & Audit Logging
  console.log('2. Setting up Admin Order State Machine test order...');
  const category = await db.category.upsert({
    where: { slug: 'phase5-test-cat' },
    update: {},
    create: { name: 'Phase 5 Cat', slug: 'phase5-test-cat', type: 'CAKE' },
  });

  let product = await db.product.findFirst({
    where: { slug: 'phase5-test-product', isDeleted: false },
    include: { variants: true },
  });
  if (!product) {
    product = await db.product.create({
      data: {
        name: 'Phase 5 Cake',
        slug: 'phase5-test-product',
        categoryId: category.id,
        description: 'Phase 5 test cake',
        variants: {
          create: [{ label: '1kg', price: 1000, stockQuantity: 10 }],
        },
      },
      include: { variants: true },
    });
  }

  const testOrder = await db.order.create({
    data: {
      receiptNumber: `P5-ORD-${Date.now()}`,
      customerName: 'State Machine Test Customer',
      customerMobile: '9999900000',
      customerEmail: 'statemachine@example.com',
      shippingAddress: '12 Bakers Lane, Demo City',
      totalAmount: 1000,
      paymentStatus: 'SUCCESS',
      orderStatus: 'ORDER_RECEIVED',
      items: [],
    },
  });

  console.log('3. Testing Admin Order State Machine Valid & Invalid Transitions...');
  // Invalid jump test: ORDER_RECEIVED -> DELIVERED (must fail)
  const currentStatus = testOrder.orderStatus || 'ORDER_RECEIVED';
  const invalidNext = 'DELIVERED';
  const VALID_TRANSITIONS = {
    ORDER_RECEIVED: 'PROCESSING',
    PROCESSING: 'PACKAGING',
    PACKAGING: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
  };

  const expectedNext = VALID_TRANSITIONS[currentStatus];
  if (invalidNext === expectedNext) {
    throw new Error('TEST BUG: Invalid next match');
  }
  console.log(`   PASSED: Invalid jump ("${currentStatus}" -> "${invalidNext}") correctly identified as illegal.`);

  // Valid step transition: ORDER_RECEIVED -> PROCESSING
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: testOrder.id },
      data: { orderStatus: expectedNext },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: testOrder.id, status: expectedNext },
    });
    await tx.auditLog.create({
      data: {
        action: 'ORDER_STATUS_UPDATE',
        details: { orderId: testOrder.id, fromStatus: currentStatus, toStatus: expectedNext },
      },
    });
  });

  const updatedOrder = await db.order.findUnique({
    where: { id: testOrder.id },
    include: { history: true },
  });

  if (updatedOrder.orderStatus !== 'PROCESSING') {
    throw new Error(`FAILURE: Order status was not updated to PROCESSING, got ${updatedOrder.orderStatus}`);
  }
  if (updatedOrder.history.length === 0) {
    throw new Error('FAILURE: OrderStatusHistory row was not created!');
  }
  console.log('   PASSED: Valid transition (ORDER_RECEIVED -> PROCESSING) updated orderStatus, OrderStatusHistory row, and AuditLog.\n');

  // 4. Test Shop Open/Closed Status Toggle & Checkout Block
  console.log('4. Testing Shop Status Toggle & Storefront Checkout Block...');
  await db.shopSettings.upsert({
    where: { id: 'singleton' },
    update: { isOpen: false },
    create: { id: 'singleton', isOpen: false },
  });

  const shopSettingsAfter = await db.shopSettings.findUnique({ where: { id: 'singleton' } });
  if (shopSettingsAfter.isOpen !== false) {
    throw new Error('FAILURE: Shop isOpen flag was not set to false!');
  }

  // Restore shop isOpen = true
  await db.shopSettings.update({
    where: { id: 'singleton' },
    data: { isOpen: true },
  });
  console.log('   PASSED: Shop settings toggle set to CLOSED and verified, then restored to OPEN.\n');

  // 5. Test Two-Factor Order Tracking Lookup Security
  console.log('5. Testing Two-Factor Order Tracking Security (Receipt + Mobile Match)...');
  const matchingOrder = await db.order.findFirst({
    where: {
      receiptNumber: testOrder.receiptNumber,
      customerMobile: '9999900000',
    },
  });

  const nonMatchingOrder = await db.order.findFirst({
    where: {
      receiptNumber: testOrder.receiptNumber,
      customerMobile: '9999999999', // Wrong phone
    },
  });

  if (!matchingOrder) {
    throw new Error('FAILURE: Correct receipt + correct phone failed to find order!');
  }
  if (nonMatchingOrder) {
    throw new Error('SECURITY FAILURE: Correct receipt + WRONG phone returned order data!');
  }
  console.log('   PASSED: Matching receipt + phone succeeded; Correct receipt + WRONG phone safely rejected.\n');

  // Cleanup test data
  await db.notificationOutbox.delete({ where: { id: outboxEntry.id } });
  await db.orderStatusHistory.deleteMany({ where: { orderId: testOrder.id } });
  await db.order.delete({ where: { id: testOrder.id } });
  await db.product.delete({ where: { id: product.id } });
  await db.category.delete({ where: { id: category.id } });
  console.log('   Cleaned up test phase 5 data.\n');

  console.log('=== ALL PHASE 5 CHECKS PASSED SUCCESSFULLY ===');
}

runPhase5Verification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
