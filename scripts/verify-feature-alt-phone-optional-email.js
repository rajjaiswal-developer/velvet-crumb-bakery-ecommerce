const { PrismaClient } = require('@prisma/client');
const { checkoutInputSchema } = require('../lib/validation/schemas');
const { generateOrderInvoicePdf } = require('../lib/invoices/pdf');

const prisma = new PrismaClient();

async function runFeatureVerification() {
  console.log('====================================================');
  console.log('FEATURE VERIFICATION: ALT PHONE & OPTIONAL EMAIL');
  console.log('====================================================\n');

  try {
    // 1. Zod Schema Validation Tests
    console.log('1. Testing Zod checkoutInputSchema validation rules...');

    // 1a. Optional email = empty string -> transformed to null
    const val1 = checkoutInputSchema.safeParse({
      name: 'Rahul Sharma',
      email: '',
      phone: '9999900000',
      confirmPhone: '9999900000',
      alternatePhone: '9876543211',
      address: 'Flat 302, Sai Tower, LBS Marg, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: '2-hours',
    });
    if (val1.success && val1.data.email === null && val1.data.alternatePhone === '9876543211') {
      console.log('   ✅ PASSED: Empty email transformed to null; valid 10-digit alternatePhone accepted!');
    } else {
      throw new Error(`Validation test 1a failed: ${JSON.stringify(val1)}`);
    }

    // 1b. Invalid alternate phone (not 10 digits) -> rejected
    const val2 = checkoutInputSchema.safeParse({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '9999900000',
      confirmPhone: '9999900000',
      alternatePhone: '12345',
      address: 'Flat 302, Sai Tower, LBS Marg, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: '2-hours',
    });
    if (!val2.success) {
      console.log('   ✅ PASSED: Invalid alternatePhone ("12345") correctly rejected with validation error!');
    } else {
      throw new Error('Validation test 1b failed: expected invalid alternatePhone to be rejected');
    }

    // 1c. Invalid email -> rejected
    const val3 = checkoutInputSchema.safeParse({
      name: 'Rahul Sharma',
      email: 'invalid-email-format',
      phone: '9999900000',
      confirmPhone: '9999900000',
      address: 'Flat 302, Sai Tower, LBS Marg, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: '2-hours',
    });
    if (!val3.success) {
      console.log('   ✅ PASSED: Invalid email format correctly rejected!');
    } else {
      throw new Error('Validation test 1c failed: expected invalid email to be rejected');
    }

    // 2. Database Order Creation & Model Verification
    console.log('\n2. Testing Database Order creation with combinations...');

    const timestamp = Date.now();

    // Combination A: Both phone numbers + email provided
    const orderA = await prisma.order.create({
      data: {
        receiptNumber: `VERIFY-A-${timestamp}`,
        customerName: 'Test Both Contact & Email',
        customerMobile: '9999900000',
        alternatePhone: '9876543211',
        customerEmail: 'both@example.com',
        shippingAddress: '12 Bakers Lane, Demo City',
        deliveryTimeSlot: '2-hours',
        totalAmount: 499.00,
        paymentStatus: 'SUCCESS',
        orderStatus: 'ORDER_RECEIVED',
        items: [{ productName: 'Chocolate Truffle Cake', variantLabel: '500g', quantity: 1, itemTotal: 499 }],
      },
    });
    console.log(`   ✅ PASSED: Order A created with alternatePhone="${orderA.alternatePhone}" & customerEmail="${orderA.customerEmail}"`);

    // Combination B: Primary phone only, NO email, NO alternate phone
    const orderB = await prisma.order.create({
      data: {
        receiptNumber: `VERIFY-B-${timestamp}`,
        customerName: 'Test Primary Phone Only No Email',
        customerMobile: '9876543220',
        alternatePhone: null,
        customerEmail: null,
        shippingAddress: '12 Bakers Lane, Demo City',
        deliveryTimeSlot: '2-hours',
        totalAmount: 599.00,
        paymentStatus: 'SUCCESS',
        orderStatus: 'ORDER_RECEIVED',
        items: [{ productName: 'Red Velvet Cake', variantLabel: '1kg', quantity: 1, itemTotal: 599 }],
      },
    });
    console.log(`   ✅ PASSED: Order B created with customerEmail=null & alternatePhone=null`);

    // Combination C: Alternate phone provided, NO email
    const orderC = await prisma.order.create({
      data: {
        receiptNumber: `VERIFY-C-${timestamp}`,
        customerName: 'Test Alt Phone No Email',
        customerMobile: '9876543230',
        alternatePhone: '9876543231',
        customerEmail: null,
        shippingAddress: '12 Bakers Lane, Demo City',
        deliveryTimeSlot: '3-hours',
        totalAmount: 699.00,
        paymentStatus: 'SUCCESS',
        orderStatus: 'ORDER_RECEIVED',
        items: [{ productName: 'Pineapple Cake', variantLabel: '500g', quantity: 1, itemTotal: 699 }],
      },
    });
    console.log(`   ✅ PASSED: Order C created with alternatePhone="${orderC.alternatePhone}" & customerEmail=null`);

    // 3. PDF Invoice Generation Verification
    console.log('\n3. Testing PDF Invoice generation for orders without email & with alt phone...');
    const pdfBufB = await generateOrderInvoicePdf(orderB.id);
    if (pdfBufB && pdfBufB.length > 500 && pdfBufB.slice(0, 5).toString() === '%PDF-') {
      console.log(`   ✅ PASSED: PDF Invoice generated successfully (${pdfBufB.length} bytes) for order without email!`);
    } else {
      throw new Error('PDF Invoice generation failed for order without email');
    }

    const pdfBufC = await generateOrderInvoicePdf(orderC.id);
    if (pdfBufC && pdfBufC.length > 500 && pdfBufC.slice(0, 5).toString() === '%PDF-') {
      console.log(`   ✅ PASSED: PDF Invoice generated successfully (${pdfBufC.length} bytes) for order with alternate phone and no email!`);
    } else {
      throw new Error('PDF Invoice generation failed for order with alternate phone');
    }

    // Clean up temporary test verification records
    await prisma.order.deleteMany({
      where: { id: { in: [orderA.id, orderB.id, orderC.id] } },
    });
    console.log('\n   Temporary verification script orders cleaned up.');

    console.log('\n====================================================');
    console.log('ALL FEATURE VERIFICATION CHECKS PASSED 100%');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Feature verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFeatureVerification();
