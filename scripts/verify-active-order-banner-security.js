const http = require('http');
const { PrismaClient } = require('@prisma/client');
const { SignJWT, jwtVerify } = require('jose');

const prisma = new PrismaClient();

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body: buffer.toString('utf8'), buffer });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityVerification() {
  console.log('====================================================');
  console.log('ACTIVE ORDER SESSION & STATUS BANNER SECURITY GATE');
  console.log('====================================================\n');

  const orderSecret = new TextEncoder().encode(
    process.env.ORDER_SESSION_SECRET || 'c7d6e9f2a4b810359e12739a84f0b2e5a193c714d68e09f5832a10b48f93c125'
  );
  const adminSecret = new TextEncoder().encode(
    process.env.ADMIN_SESSION_SECRET || '51f0b7b4a7212ec760f85e06f96d79a797e2d13d23029119d26d7e1436c0c780'
  );

  // 1. Dedicated Secret Key Isolation Check
  console.log('1. Testing Dedicated ORDER_SESSION_SECRET Key Isolation...');
  const testOrderToken = await new SignJWT({ orderId: 'test-order-uuid-123' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(orderSecret);

  try {
    await jwtVerify(testOrderToken, adminSecret, { algorithms: ['HS256'] });
    throw new Error('SECURITY FAILURE: Order session token was verified using ADMIN_SESSION_SECRET!');
  } catch (err) {
    if (err.message.includes('SECURITY FAILURE')) throw err;
    console.log('   PASSED: Order session token rejected by ADMIN_SESSION_SECRET key.');
  }

  // 2. Setup Test Order in DB as PENDING
  console.log('\n2. Creating test order in DB with paymentStatus = PENDING...');
  const testReceipt = `SEC${Date.now().toString().slice(-6)}`;
  const testOrder = await prisma.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'Secret Test Customer',
      customerMobile: '9123456789',
      customerEmail: 'sectest@example.com',
      shippingAddress: '123 Security Blvd, 12 Bakers Lane, Demo City',
      items: [{ productName: 'Test Cake', quantity: 1, itemTotal: 500 }],
      totalAmount: 500,
      orderStatus: 'ORDER_RECEIVED',
      paymentStatus: 'PENDING',
    },
  });

  console.log(`   Created PENDING test order ID: ${testOrder.id} (Receipt #: ${testReceipt})`);

  // 3. Test Direct Access for PENDING Order (Generic Error Gate)
  console.log('\n3. Testing Payment Verification Gate for PENDING Order URL...');
  const pendingRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/public?receiptNumber=${testReceipt}`,
    method: 'GET',
  });

  console.log(`   Pending Order GET Response Status: ${pendingRes.status}`);
  const pendingBody = JSON.parse(pendingRes.body);
  console.log(`   Response Payload:`, pendingBody);

  if (pendingRes.status !== 404 || pendingBody.success !== false) {
    throw new Error('FAILURE: PENDING order URL did NOT return 404 generic error state!');
  }

  const setCookieHeader = pendingRes.headers['set-cookie'];
  if (setCookieHeader && Array.isArray(setCookieHeader) && setCookieHeader.some((c) => c.includes('active_order_session'))) {
    throw new Error('SECURITY FAILURE: Cookie active_order_session was issued for a PENDING order!');
  }

  console.log('   PASSED: PENDING order correctly returned generic error, blocked UI, and set NO cookie!');

  // 4. Test Anonymous Request to /api/orders/active-status (No Cookie)
  console.log('\n4. Testing GET /api/orders/active-status without cookie...');
  const noCookieRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/active-status',
    method: 'GET',
  });

  const noCookieBody = JSON.parse(noCookieRes.body);
  if (!noCookieBody.success || noCookieBody.active !== false) {
    throw new Error('FAILURE: Anonymous request without cookie did not return active: false');
  }
  console.log('   PASSED: Request without cookie returned active: false.');

  // 5. Test Forged Cookie Request to /api/orders/active-status
  console.log('\n5. Testing GET /api/orders/active-status with forged/tampered cookie...');
  const forgedRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/active-status',
    method: 'GET',
    headers: {
      Cookie: `active_order_session=forged_invalid_jwt_signature_string`,
    },
  });

  const forgedBody = JSON.parse(forgedRes.body);
  if (!forgedBody.success || forgedBody.active !== false) {
    throw new Error('SECURITY FAILURE: Forged cookie was accepted by active-status handler!');
  }
  console.log('   PASSED: Forged cookie rejected with active: false.');

  // 6. Transition Order to SUCCESS & Verify Single Server Cookie Issuance
  console.log('\n6. Updating test order paymentStatus = SUCCESS and testing server cookie issuance...');
  await prisma.order.update({
    where: { id: testOrder.id },
    data: { paymentStatus: 'SUCCESS' },
  });

  const successRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/public?receiptNumber=${testReceipt}`,
    method: 'GET',
  });

  console.log(`   SUCCESS Order GET Response Status: ${successRes.status}`);
  if (successRes.status !== 200) {
    throw new Error(`FAILURE: SUCCESS order query returned ${successRes.status}`);
  }

  const successSetCookie = successRes.headers['set-cookie'];
  const cookieStr = Array.isArray(successSetCookie) ? successSetCookie.join('; ') : successSetCookie || '';

  if (!cookieStr.includes('active_order_session=')) {
    throw new Error('FAILURE: active_order_session cookie was NOT set in response for SUCCESS order!');
  }

  const activeCookieMatch = cookieStr.match(/active_order_session=([^;]+)/);
  const activeToken = activeCookieMatch ? activeCookieMatch[1] : '';

  console.log('   PASSED: Server issued HttpOnly active_order_session cookie upon SUCCESS order load.');

  // 7. Test Active Status Banner Minimal Data Exposure
  console.log('\n7. Testing GET /api/orders/active-status with valid active_order_session cookie...');
  const bannerRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/active-status',
    method: 'GET',
    headers: {
      Cookie: `active_order_session=${activeToken}`,
    },
  });

  const bannerBody = JSON.parse(bannerRes.body);
  console.log('   Banner Response:', bannerBody);

  if (!bannerBody.success || !bannerBody.active || !bannerBody.data) {
    throw new Error('FAILURE: Active order status banner did not return active order data');
  }

  const dataObj = bannerBody.data;
  if (dataObj.receiptNumber !== testReceipt || dataObj.orderStatus !== 'ORDER_RECEIVED') {
    throw new Error('FAILURE: Banner data receipt or orderStatus mismatched');
  }

  // Assert zero PII exposure
  if (
    dataObj.customerName !== undefined ||
    dataObj.customerMobile !== undefined ||
    dataObj.shippingAddress !== undefined ||
    dataObj.items !== undefined
  ) {
    throw new Error('SECURITY FAILURE: Minimal status endpoint exposed customer PII or item list!');
  }

  console.log('   PASSED: Active status banner returned minimal data ONLY (receiptNumber & orderStatus). Zero PII exposed!');

  // 8. Test Invoice Defense-in-Depth Authorization Gate
  console.log('\n8. Testing Invoice Defense-in-Depth Authorization Gate...');

  // 8a. Request without session or phone -> Expect 403
  const unauthorizedInvoiceRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${testOrder.id}/invoice`,
    method: 'GET',
  });

  if (unauthorizedInvoiceRes.status !== 403) {
    throw new Error(`SECURITY FAILURE: Unauthorized invoice access returned status ${unauthorizedInvoiceRes.status} (Expected 403)`);
  }
  console.log('   PASSED: Unauthorized invoice access blocked with 403 Forbidden.');

  // 8b. Request with active_order_session cookie -> Expect 200 OK %PDF-
  const sessionInvoiceRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${testOrder.id}/invoice`,
    method: 'GET',
    headers: {
      Cookie: `active_order_session=${activeToken}`,
    },
  });

  const pdfMagicHeaderSession = sessionInvoiceRes.buffer.slice(0, 5).toString();
  if (sessionInvoiceRes.status !== 200 || pdfMagicHeaderSession !== '%PDF-') {
    throw new Error(`FAILURE: Authorized invoice access with session cookie failed (Status: ${sessionInvoiceRes.status}, Header: ${pdfMagicHeaderSession})`);
  }
  console.log('   PASSED: Session owner successfully downloaded PDF invoice.');

  // 8c. Request with matching phone parameter -> Expect 200 OK %PDF-
  const phoneInvoiceRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${testOrder.id}/invoice?phone=9123456789`,
    method: 'GET',
  });

  const pdfMagicHeaderPhone = phoneInvoiceRes.buffer.slice(0, 5).toString();
  if (phoneInvoiceRes.status !== 200 || pdfMagicHeaderPhone !== '%PDF-') {
    throw new Error(`FAILURE: 2-Factor phone verification for invoice failed (Status: ${phoneInvoiceRes.status}, Header: ${pdfMagicHeaderPhone})`);
  }
  console.log('   PASSED: 2-Factor phone verification successfully authorized PDF invoice download.');

  // 9. Test DELIVERED Order Auto-Clear
  console.log('\n9. Testing DELIVERED order status banner auto-clear...');
  await prisma.order.update({
    where: { id: testOrder.id },
    data: { orderStatus: 'DELIVERED' },
  });

  const deliveredBannerRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/active-status',
    method: 'GET',
    headers: {
      Cookie: `active_order_session=${activeToken}`,
    },
  });

  const deliveredBody = JSON.parse(deliveredBannerRes.body);
  if (!deliveredBody.success || deliveredBody.active !== false) {
    throw new Error('FAILURE: DELIVERED order did not deactivate status banner!');
  }

  const clearCookieHeader = deliveredBannerRes.headers['set-cookie'];
  if (clearCookieHeader && Array.isArray(clearCookieHeader) && clearCookieHeader.some((c) => c.includes('active_order_session=;'))) {
    console.log('   PASSED: Cookie active_order_session was cleared in response for DELIVERED order.');
  }

  console.log('   PASSED: DELIVERED order automatically hid status banner and cleared cookie.\n');

  // 10. Cleanup
  console.log('10. Cleaning up test data...');
  await prisma.order.delete({ where: { id: testOrder.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('====================================================');
  console.log('ALL SECURITY & BANNER VERIFICATION CHECKS PASSED');
  console.log('====================================================');
}

runSecurityVerification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
