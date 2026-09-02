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

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

function sanitizeUrl(rawUrl) {
  if (!rawUrl) return 'NOT SET';
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return 'INVALID URL FORMAT';
  }
}

async function runConnDiag() {
  console.log('====================================================');
  console.log('DATABASE CONNECTION & QUERY LATENCY BREAKDOWN');
  console.log('====================================================\n');

  console.log('1. Connection Configuration:');
  console.log(`   DATABASE_URL: ${sanitizeUrl(process.env.DATABASE_URL)}`);
  console.log(`   DIRECT_URL:   ${sanitizeUrl(process.env.DIRECT_URL)}\n`);

  // Test 1: Direct Prisma query time (Without history include)
  console.log('2. Direct Prisma Query Timing (WITHOUT history include):');
  const t1 = Date.now();
  const ordersWithoutHistory = await prisma.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
  });
  const dur1 = Date.now() - t1;
  console.log(`   Fetched ${ordersWithoutHistory.length} orders in ${dur1} ms.\n`);

  // Test 2: Direct Prisma query time (WITH history include)
  console.log('3. Direct Prisma Query Timing (WITH history include):');
  const t2 = Date.now();
  const ordersWithHistory = await prisma.order.findMany({
    where: { paymentStatus: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
    include: {
      history: { orderBy: { changedAt: 'asc' } },
    },
  });
  const dur2 = Date.now() - t2;
  console.log(`   Fetched ${ordersWithHistory.length} orders with history in ${dur2} ms.`);
  console.log(`   History Include Overhead: ${dur2 - dur1} ms.\n`);

  // Test 3: Multiple consecutive query runs to test connection pooling reuse
  console.log('4. Warm Query Timing (5 consecutive runs WITH history):');
  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    await prisma.order.findMany({
      where: { paymentStatus: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      include: { history: { orderBy: { changedAt: 'asc' } } },
    });
    console.log(`   Run #${i}: ${Date.now() - start} ms`);
  }

  await prisma.$disconnect();
}

runConnDiag().catch(console.error);
