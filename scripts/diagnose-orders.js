const { PrismaClient } = require('@prisma/client');
const http = require('http');
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
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function diagnose() {
  console.log('--- DATABASE DIAGNOSTIC REPORT ---');

  // 1. Total order counts
  const totalCount = await prisma.order.count();
  const successCount = await prisma.order.count({ where: { paymentStatus: 'SUCCESS' } });
  const pendingCount = await prisma.order.count({ where: { paymentStatus: 'PENDING' } });
  const failedCount = await prisma.order.count({ where: { paymentStatus: 'FAILED' } });
  const expiredCount = await prisma.order.count({ where: { paymentStatus: 'EXPIRED' } });
  const cancelledCount = await prisma.order.count({ where: { paymentStatus: 'CANCELLED' } });

  console.log(`TOTAL ORDERS IN DB: ${totalCount}`);
  console.log(`- SUCCESS: ${successCount}`);
  console.log(`- PENDING: ${pendingCount}`);
  console.log(`- FAILED: ${failedCount}`);
  console.log(`- EXPIRED: ${expiredCount}`);
  console.log(`- CANCELLED: ${cancelledCount}`);

  // 2. Admin Login & API Latency Measurement
  console.log('\n--- API RESPONSE LATENCY MEASUREMENT ---');
  const loginPayload = JSON.stringify({ email: 'admin@velvetcrumbdemo.com', password: 'AdminVelvet#2026!' });
  const loginRes = await makeHttpRequest('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: loginPayload,
  });

  const setCookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
  const cookieMatch = setCookieHeader.match(/admin_session=([^;]+)/);
  const cookie = cookieMatch ? `admin_session=${cookieMatch[1]}` : '';

  // Measure 3 sample requests to GET /api/admin/orders?paymentStatus=SUCCESS
  const latencies = [];
  let payloadBytes = 0;
  for (let i = 1; i <= 3; i++) {
    const res = await makeHttpRequest('/api/admin/orders?paymentStatus=SUCCESS', {
      headers: { cookie: cookie },
    });
    latencies.push(res.duration);
    payloadBytes = Buffer.byteLength(res.body);
    console.log(`Sample #${i}: HTTP ${res.status} | Latency: ${res.duration} ms | Response size: ${payloadBytes} bytes`);
  }

  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  console.log(`Average API Latency: ${avgLatency} ms`);

  await prisma.$disconnect();
}

diagnose().catch(console.error);
