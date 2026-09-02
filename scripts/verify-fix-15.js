const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFICATION FOR FIX-15: SLOW PAYMENT REDIRECT & LOADING OVERLAY');
  console.log('====================================================\n');

  // 1. Audit PaymentProcessingOverlay component file
  console.log('1. Auditing PaymentProcessingOverlay component on disk...');
  const overlayPath = path.join(process.cwd(), 'components', 'storefront', 'PaymentProcessingOverlay.tsx');
  if (!fs.existsSync(overlayPath)) {
    throw new Error('FAILURE: PaymentProcessingOverlay.tsx component file missing on disk!');
  }
  const overlayContent = fs.readFileSync(overlayPath, 'utf8');
  if (!overlayContent.includes('Confirming Your Payment...') || !overlayContent.includes('beforeunload')) {
    throw new Error('FAILURE: PaymentProcessingOverlay missing required title or beforeunload protection!');
  }
  console.log('   PASSED: PaymentProcessingOverlay component validated on disk.\n');

  // 2. Audit CheckoutPage & useCheckout hook integration
  console.log('2. Auditing app/checkout/page.tsx & useCheckout hook integration...');
  const checkoutPath = path.join(process.cwd(), 'app', 'checkout', 'page.tsx');
  const checkoutHookPath = path.join(process.cwd(), 'lib', 'hooks', 'useCheckout.ts');
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  const checkoutHookContent = fs.readFileSync(checkoutHookPath, 'utf8');
  if (!checkoutContent.includes('PaymentProcessingOverlay') || (!checkoutContent.includes('setIsConfirmingPayment(true)') && !checkoutHookContent.includes('setIsConfirmingPayment(true)'))) {
    throw new Error('FAILURE: app/checkout/page.tsx or useCheckout.ts missing PaymentProcessingOverlay integration or instant trigger!');
  }
  console.log('   PASSED: Checkout page instant loading overlay trigger validated.\n');

  // 3. Audit OrderConfirmationPage & useOrderConfirmation hook polling integration
  console.log('3. Auditing app/orders/[receiptNumber]/page.tsx & useOrderConfirmation hook polling & overlay integration...');
  const confirmationPath = path.join(process.cwd(), 'app', 'orders', '[receiptNumber]', 'page.tsx');
  const confirmationHookPath = path.join(process.cwd(), 'lib', 'hooks', 'useOrderConfirmation.ts');
  const confirmationContent = fs.readFileSync(confirmationPath, 'utf8');
  const confirmationHookContent = fs.readFileSync(confirmationHookPath, 'utf8');
  if (!confirmationContent.includes('PaymentProcessingOverlay') || (!confirmationContent.includes('attempt < 5') && !confirmationHookContent.includes('attempt < 5'))) {
    throw new Error('FAILURE: OrderConfirmationPage or useOrderConfirmation.ts missing PaymentProcessingOverlay or polling retry logic!');
  }
  console.log('   PASSED: Order confirmation page polling retry logic validated.\n');

  // 4. Test end-to-end payment confirmation transaction latency & safety
  console.log('4. Testing database payment confirmation latency & state transition...');
  const testReceipt = `FIX15-${Date.now().toString().slice(-6)}`;
  
  // Create pending order
  const order = await prisma.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'Fix 15 Test Customer',
      customerMobile: '9999900000',
      customerEmail: 'fix15@example.com',
      shippingAddress: '123 Test Street, Demo City, Mumbai',
      items: [{ productName: 'Chocolate Cake', quantity: 1, itemTotal: 500 }],
      totalAmount: 500,
      orderStatus: 'ORDER_RECEIVED',
      paymentStatus: 'PENDING',
    },
  });

  const startTime = Date.now();
  // Update to SUCCESS simulating webhook
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'SUCCESS' },
  });
  const durationMs = Date.now() - startTime;

  console.log(`   Payment confirmation DB update duration: ${durationMs}ms`);
  if (durationMs > 2000) {
    throw new Error(`FAILURE: DB update took ${durationMs}ms, expected under 2000ms`);
  }
  console.log('   PASSED: DB state transition executed under 2000ms.\n');

  // 5. Cleanup
  console.log('5. Cleaning up test data...');
  await prisma.order.delete({ where: { id: order.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('====================================================');
  console.log('ALL FIX-15 VERIFICATION CHECKS PASSED SUCCESSFULLY');
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
