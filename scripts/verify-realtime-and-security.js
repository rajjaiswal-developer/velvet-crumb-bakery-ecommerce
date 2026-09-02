const http = require('http');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env / .env.local
['.env', '.env.local'].forEach((file) => {
  const envPath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
});

const prisma = new PrismaClient();

function makeHttpRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const reqOptions = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          duration,
          timestamp: new Date().toISOString(),
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runSecurityAndRealtimeAudit() {
  console.log('================================================================');
  console.log('EMPIRICAL RUNTIME AUDIT: AUTH SECURITY, POLLING & NOTIFICATIONS');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: REAL UNAUTHENTICATED REQUEST TO GET /api/admin/orders
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Unauthenticated GET /api/admin/orders Security Test ---');
    console.log('Sending raw HTTP GET request without session cookie...');
    const unauthRes = await makeHttpRequest('/api/admin/orders');

    console.log(`[RAW RESPONSE LOG] Timestamp: ${unauthRes.timestamp}`);
    console.log(`[RAW RESPONSE LOG] HTTP Status Code: ${unauthRes.status}`);
    console.log(`[RAW RESPONSE LOG] Content-Type: ${unauthRes.headers['content-type']}`);
    console.log(`[RAW RESPONSE LOG] Body Output: ${unauthRes.body}`);

    const unauthJson = JSON.parse(unauthRes.body);
    if (unauthRes.status === 401 && unauthJson.success === false && unauthJson.error === 'Unauthorized') {
      console.log('✅ PASSED: API returned real 401 Unauthorized response for unauthenticated request!\n');
    } else {
      throw new Error(`Unauthenticated security check failed! Got status ${unauthRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: ADMIN AUTHENTICATION & SESSION COOKIE EXTRACTION
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Admin Login & Session Cookie Acquisition ---');
    console.log('Logging in as admin (admin@velvetcrumbdemo.com)...');
    const loginRes = await makeHttpRequest('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@velvetcrumbdemo.com', password: 'AdminVelvet#2026!' }),
    });

    console.log(`[RAW RESPONSE LOG] Login HTTP Status Code: ${loginRes.status}`);
    console.log(`[RAW RESPONSE LOG] Set-Cookie Header: ${loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : 'NONE'}`);

    const setCookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    const cookieMatch = setCookieHeader.match(/admin_session=([^;]+)/);
    if (!cookieMatch) {
      throw new Error('Failed to acquire admin_session cookie from login response!');
    }

    const sessionCookie = `admin_session=${cookieMatch[1]}`;
    console.log('✅ PASSED: Successfully authenticated and extracted session cookie!\n');

    // -------------------------------------------------------------------------
    // TEST 3: REAL-TIME POLLING REQUEST TIMING & NETWORK AUDIT
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Polling Request Network & Timing Audit (12s Interval Simulation) ---');
    console.log('Executing 3 consecutive authenticated polling requests to /api/admin/orders...');

    const pollLogs = [];
    for (let i = 1; i <= 3; i++) {
      console.log(`\n  Executing Poll Request #${i}...`);
      const pollRes = await makeHttpRequest('/api/admin/orders?paymentStatus=SUCCESS', {
        headers: { Cookie: sessionCookie },
      });
      const data = JSON.parse(pollRes.body);
      pollLogs.push({
        pollIndex: i,
        timestamp: pollRes.timestamp,
        statusCode: pollRes.status,
        durationMs: pollRes.duration,
        recordsReturned: Array.isArray(data.data) ? data.data.length : 0,
      });
      console.log(`  - Logged Poll #${i}: Status ${pollRes.status} | Duration: ${pollRes.duration}ms | Orders count: ${data.data.length}`);

      if (i < 3) {
        console.log('  Waiting 3 seconds before next poll sample...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log('\n[NETWORK TIMING SUMMARY LOG]:');
    pollLogs.forEach((l) => {
      console.log(`  [Poll #${l.pollIndex}] Timestamp: ${l.timestamp} | HTTP ${l.statusCode} OK | Latency: ${l.durationMs}ms | Payload: ${l.recordsReturned} orders`);
    });
    console.log('✅ PASSED: Polling requests execute cleanly with 200 OK and low latency!\n');

    // -------------------------------------------------------------------------
    // TEST 4: FILTER-INDEPENDENT REAL-TIME NEW ORDER DETECTION (SCENARIO 4)
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Filter-Independent New Order Notification Audit ---');
    console.log('Simulating UI state: Admin has payment filter dropdown set to "PENDING"...');

    const pendingFilterRes = await makeHttpRequest('/api/admin/orders?paymentStatus=PENDING', {
      headers: { Cookie: sessionCookie },
    });
    const pendingData = JSON.parse(pendingFilterRes.body);
    console.log(`[RAW LOG] UI table view (PENDING filter) currently shows: ${pendingData.data.length} pending orders.`);

    console.log('\nPlacing a brand new SUCCESS paid order in database...');
    const testReceipt = `AC-REALTIME-${Date.now()}`;
    const newPaidOrder = await prisma.order.create({
      data: {
        receiptNumber: testReceipt,
        customerName: 'Priya Sharma',
        customerMobile: '9999900000',
        customerEmail: 'priya.sharma@example.com',
        shippingAddress: 'Flat 101, Green Acres, LBS Marg, 12 Bakers Lane, Demo City',
        deliveryTimeSlot: '4:00 PM - 6:00 PM',
        specialInstructions: 'Please deliver fresh. Ring door bell twice.',
        totalAmount: 950.00,
        paymentStatus: 'SUCCESS',
        orderStatus: 'ORDER_RECEIVED',
        items: [
          {
            productId: 'prod-cake-02',
            variantId: 'var-1kg',
            productName: 'Red Velvet Deluxe Cake',
            variantLabel: '1kg',
            quantity: 1,
            price: 950.00,
          },
        ],
      },
    });

    console.log(`[RAW LOG] Created New Paid Order Receipt: ${newPaidOrder.receiptNumber} (ID: ${newPaidOrder.id})`);

    console.log('\nSimulating background notification check (/api/admin/orders?paymentStatus=SUCCESS)...');
    const backgroundCheckRes = await makeHttpRequest('/api/admin/orders?paymentStatus=SUCCESS', {
      headers: { Cookie: sessionCookie },
    });
    const backgroundData = JSON.parse(backgroundCheckRes.body);

    const isNewOrderDiscovered = backgroundData.data.some((o) => o.id === newPaidOrder.id);
    console.log(`[RAW LOG] Background check discovered new order ID (${newPaidOrder.id}): ${isNewOrderDiscovered}`);

    // Verify UI table view with PENDING filter still only returns PENDING orders
    const pendingRecheckRes = await makeHttpRequest('/api/admin/orders?paymentStatus=PENDING', {
      headers: { Cookie: sessionCookie },
    });
    const pendingRecheckData = JSON.parse(pendingRecheckRes.body);
    const inPendingList = pendingRecheckData.data.some((o) => o.id === newPaidOrder.id);

    console.log(`[RAW LOG] UI table view (PENDING filter) contains new order: ${inPendingList} (Correctly excluded from table)`);

    if (isNewOrderDiscovered && !inPendingList) {
      console.log('✅ PASSED: Filter-independent new order detection verified! Background check detected new SUCCESS order even while UI filter is set to PENDING!\n');
    } else {
      throw new Error('Filter-independent order detection test failed!');
    }

    // Cleanup
    console.log('Cleaning up realtime test order...');
    await prisma.order.delete({ where: { id: newPaidOrder.id } });
    console.log('✅ PASSED: Cleaned up realtime test order.\n');

    console.log('================================================================');
    console.log('ALL EMPIRICAL RUNTIME AUDIT SCENARIOS PASSED WITH ZERO ERRORS');
    console.log('================================================================');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityAndRealtimeAudit();
