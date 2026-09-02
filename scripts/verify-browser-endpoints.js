const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('====================================================');
  console.log('ENDPOINT & API VERIFICATION FOR RUNNING DEV SERVER');
  console.log('====================================================\n');

  try {
    // 1. GET /checkout HTTP response status
    console.log('1. Testing GET http://localhost:3000/checkout...');
    const checkoutRes = await makeRequest('http://localhost:3000/checkout');
    console.log(`   HTTP Status Code: ${checkoutRes.status}`);
    if (checkoutRes.status === 200) {
      console.log('   ✅ PASSED: Checkout page returned 200 OK cleanly!\n');
    } else {
      throw new Error(`GET /checkout returned ${checkoutRes.status}`);
    }

    // 2. Edge Case API Validation test: POST /api/checkout/submit with invalid alternate phone ("12345")
    console.log('2. Testing POST /api/checkout/submit with invalid alternate phone ("12345")...');
    const invalidSubmitRes = await makeRequest('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Validation',
        email: '',
        phone: '9999900000',
        confirmPhone: '9999900000',
        alternatePhone: '12345',
        address: 'Flat 302, Sai Tower, LBS Marg, 12 Bakers Lane, Demo City',
        deliveryTimeSlot: '2-hours',
      }),
    });
    console.log(`   HTTP Status Code: ${invalidSubmitRes.status}`);
    console.log(`   Response JSON Body: ${invalidSubmitRes.body}`);
    const invalidJson = JSON.parse(invalidSubmitRes.body);
    if (invalidSubmitRes.status === 400 && invalidJson.success === false && invalidJson.error.includes('10 digits')) {
      console.log('   ✅ PASSED: API correctly rejected invalid alternate phone with 400 status & validation error!\n');
    } else {
      throw new Error('API invalid alternate phone rejection test failed');
    }

    // 3. GET /api/orders/public for Test Order 1 (Both Phones + Email)
    console.log('3. Testing GET /api/orders/public for Order 1 (AC-1785472218438-101)...');
    const ord1Res = await makeRequest('http://localhost:3000/api/orders/public?receiptNumber=AC-1785472218438-101');
    console.log(`   HTTP Status Code: ${ord1Res.status}`);
    const ord1Data = JSON.parse(ord1Res.body);
    console.log(`   Primary Phone: ${ord1Data.data?.customerMobile}`);
    console.log(`   Alternate Phone: ${ord1Data.data?.alternatePhone}`);
    console.log(`   Email: ${ord1Data.data?.customerEmail}`);
    if (ord1Res.status === 200 && ord1Data.data?.alternatePhone === '9876543211' && ord1Data.data?.customerEmail === 'aarav.sharma@example.com') {
      console.log('   ✅ PASSED: Public order endpoint returns primary phone, alternate phone, and email!\n');
    } else {
      throw new Error('Public order endpoint test for Order 1 failed');
    }

    // 4. GET /api/orders/public for Test Order 2 (Primary Phone Only, No Email)
    console.log('4. Testing GET /api/orders/public for Order 2 (AC-1785472218438-102)...');
    const ord2Res = await makeRequest('http://localhost:3000/api/orders/public?receiptNumber=AC-1785472218438-102');
    console.log(`   HTTP Status Code: ${ord2Res.status}`);
    const ord2Data = JSON.parse(ord2Res.body);
    console.log(`   Primary Phone: ${ord2Data.data?.customerMobile}`);
    console.log(`   Alternate Phone: ${ord2Data.data?.alternatePhone}`);
    console.log(`   Email: ${ord2Data.data?.customerEmail}`);
    if (ord2Res.status === 200 && ord2Data.data?.alternatePhone === null && ord2Data.data?.customerEmail === null) {
      console.log('   ✅ PASSED: Public order endpoint returns null for email and alternate phone!\n');
    } else {
      throw new Error('Public order endpoint test for Order 2 failed');
    }

    // 5. GET /api/orders/public for Test Order 3 (Alternate Phone + No Email)
    console.log('5. Testing GET /api/orders/public for Order 3 (AC-1785472218438-103)...');
    const ord3Res = await makeRequest('http://localhost:3000/api/orders/public?receiptNumber=AC-1785472218438-103');
    console.log(`   HTTP Status Code: ${ord3Res.status}`);
    const ord3Data = JSON.parse(ord3Res.body);
    console.log(`   Primary Phone: ${ord3Data.data?.customerMobile}`);
    console.log(`   Alternate Phone: ${ord3Data.data?.alternatePhone}`);
    console.log(`   Email: ${ord3Data.data?.customerEmail}`);
    if (ord3Res.status === 200 && ord3Data.data?.alternatePhone === '9988776644' && ord3Data.data?.customerEmail === null) {
      console.log('   ✅ PASSED: Public order endpoint returns alternate phone and null email!\n');
    } else {
      throw new Error('Public order endpoint test for Order 3 failed');
    }

    // 6. GET /orders/[receiptNumber] HTML pages verification
    console.log('6. Testing Order Confirmation Pages HTTP Status Codes...');
    const page1Res = await makeRequest('http://localhost:3000/orders/AC-1785472218438-101');
    const page2Res = await makeRequest('http://localhost:3000/orders/AC-1785472218438-102');
    const page3Res = await makeRequest('http://localhost:3000/orders/AC-1785472218438-103');
    console.log(`   Order 1 Confirmation Page HTTP Status: ${page1Res.status}`);
    console.log(`   Order 2 Confirmation Page HTTP Status: ${page2Res.status}`);
    console.log(`   Order 3 Confirmation Page HTTP Status: ${page3Res.status}`);
    if (page1Res.status === 200 && page2Res.status === 200 && page3Res.status === 200) {
      console.log('   ✅ PASSED: All 3 order confirmation pages respond with HTTP 200 OK!\n');
    } else {
      throw new Error('Order confirmation page HTTP status test failed');
    }

    console.log('====================================================');
    console.log('ZERO ERRORS DETECTED ACROSS ALL API & ROUTE TESTS');
    console.log('====================================================');
  } catch (err) {
    console.error('Test endpoint failure:', err);
    process.exit(1);
  }
}

testEndpoints();
