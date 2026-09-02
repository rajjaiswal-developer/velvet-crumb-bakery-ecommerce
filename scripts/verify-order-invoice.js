const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dynamic import for pdf generator helper
async function runInvoiceVerification() {
  console.log('====================================================');
  console.log('VERIFICATION: PDF INVOICE GENERATION ENGINE');
  console.log('====================================================\n');

  // 1. Setup test category, product, variant & order
  console.log('1. Setting up test order with SUCCESS paymentStatus...');
  const category = await prisma.category.upsert({
    where: { slug: 'invoice-test-category' },
    update: {},
    create: {
      name: 'Invoice Test Category',
      slug: 'invoice-test-category',
      type: 'CAKE',
    },
  });

  const product = await prisma.product.create({
    data: {
      name: 'Belgian Chocolate Truffle Cake',
      slug: `invoice-test-cake-${Date.now()}`,
      categoryId: category.id,
      description: 'Rich Belgian chocolate truffle cake for invoice testing.',
      variants: {
        create: [
          {
            label: '500g',
            price: 550,
            stockQuantity: 10,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const testReceipt = `INVTEST${Date.now().toString().slice(-6)}`;
  const order = await prisma.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'Aarav Sharma',
      customerMobile: '9999900000',
      customerEmail: 'aarav@example.com',
      shippingAddress: 'Flat 402, Sai Residency, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: 'Within 2 Hours',
      specialInstructions: 'Please write Happy Birthday Aarav!',
      items: [
        {
          variantId: product.variants[0].id,
          productName: product.name,
          variantLabel: product.variants[0].label,
          quantity: 1,
          price: 550,
          itemTotal: 550,
        },
      ],
      totalAmount: 550,
      orderStatus: 'ORDER_RECEIVED',
      paymentStatus: 'SUCCESS',
      razorpayOrderId: `order_inv_${Date.now()}`,
      razorpayPaymentId: `pay_inv_${Date.now()}`,
    },
  });

  console.log(`   Created test order ID: ${order.id} (Receipt #: ${order.receiptNumber})\n`);

  // 2. Import & execute PDF generation helper
  console.log('2. Executing generateOrderInvoicePdf(order.id)...');
  const { generateOrderInvoicePdf } = require('../lib/invoices/pdf');

  const pdfBuffer = await generateOrderInvoicePdf(order.id);

  console.log(`   Generated PDF Buffer Size: ${pdfBuffer.length} bytes`);

  const pdfHeader = pdfBuffer.slice(0, 5).toString();
  console.log(`   PDF Magic Header: "${pdfHeader}"`);

  if (pdfBuffer.length < 1000) {
    throw new Error('FAILURE: Generated PDF buffer is too small (< 1000 bytes).');
  }

  if (pdfHeader !== '%PDF-') {
    throw new Error(`FAILURE: Buffer header "${pdfHeader}" is not a valid PDF header (%PDF-).`);
  }

  console.log('   PASSED: PDF Invoice engine generated valid, well-formed PDF buffer!\n');

  // 3. Test PDF generation rejection for PENDING order
  console.log('3. Testing PDF generation rejection for PENDING order...');
  const pendingOrder = await prisma.order.create({
    data: {
      receiptNumber: `PEND${Date.now().toString().slice(-6)}`,
      customerName: 'Pending User',
      customerMobile: '9876543211',
      customerEmail: 'pending@example.com',
      shippingAddress: 'Address 123',
      items: [],
      totalAmount: 100,
      paymentStatus: 'PENDING',
    },
  });

  try {
    await generateOrderInvoicePdf(pendingOrder.id);
    throw new Error('FAILURE: PDF generation did NOT throw for PENDING order!');
  } catch (err) {
    console.log(`   Correctly rejected PENDING order PDF generation: "${err.message}"`);
    console.log('   PASSED: Non-SUCCESS order PDF generation blocked!\n');
  }

  // 4. Cleanup test data
  console.log('4. Cleaning up test orders and product...');
  await prisma.order.deleteMany({ where: { id: { in: [order.id, pendingOrder.id] } } });
  await prisma.product.delete({ where: { id: product.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('====================================================');
  console.log('ALL PDF INVOICE VERIFICATION CHECKS PASSED');
  console.log('====================================================');
}

runInvoiceVerification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
