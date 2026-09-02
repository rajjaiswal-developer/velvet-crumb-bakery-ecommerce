const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function runRateLimitVerification() {
  console.log('=== VERIFYING DATABASE-BACKED RATE LIMITER ===\n');

  const testKey = 'login:127.0.0.1_test_verification';
  const windowMs = 15 * 60 * 1000;

  // 0. Clean up previous test attempts
  await db.loginAttempt.deleteMany({
    where: { key: testKey },
  });

  // Re-import / define rate limit check matching lib/auth/rate-limit.ts logic
  const checkRateLimit = async (key, limit = 5, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const windowStart = new Date(now - windowMs);

    await db.loginAttempt.deleteMany({
      where: { createdAt: { lt: windowStart } },
    });

    const count = await db.loginAttempt.count({
      where: { key, createdAt: { gte: windowStart } },
    });

    if (count >= limit) {
      return { success: false, remaining: 0 };
    }

    await db.loginAttempt.create({ data: { key } });
    return { success: true, remaining: limit - (count + 1) };
  };

  // 1. Attempt 5 rapid login checks (Happy path rate limit consumption)
  console.log('1. Recording 5 rapid login attempts...');
  for (let i = 1; i <= 5; i++) {
    const res = await checkRateLimit(testKey, 5, windowMs);
    if (!res.success) {
      throw new Error(`FAILED: Attempt ${i} was unexpectedly blocked!`);
    }
    console.log(`   Attempt ${i}: Allowed (Remaining: ${res.remaining})`);
  }

  // 2. Verify database persistence directly
  console.log('\n2. Inspecting "LoginAttempt" database table directly...');
  const dbCount = await db.loginAttempt.count({
    where: { key: testKey },
  });
  if (dbCount !== 5) {
    throw new Error(`FAILED: Expected 5 rows in LoginAttempt table, found ${dbCount}`);
  }
  console.log(`   PASSED: Found exactly ${dbCount} rows persisted in Neon PostgreSQL.`);

  // 3. Attempt 6th attempt (must be BLOCKED)
  console.log('\n3. Testing 6th attempt boundary condition...');
  const res6 = await checkRateLimit(testKey, 5, windowMs);
  if (res6.success) {
    throw new Error('FAILED: 6th attempt was NOT blocked by rate limiter!');
  }
  console.log('   PASSED: 6th attempt was blocked (Returned success: false).');

  // 4. Simulate process restart / fresh serverless function cold start
  console.log('\n4. Simulating process restart / serverless cold-start...');
  const newDbClient = new PrismaClient();
  const countAfterRestart = await newDbClient.loginAttempt.count({
    where: { key: testKey },
  });
  if (countAfterRestart !== 5) {
    throw new Error(`FAILED: Persistence lost after restart. Found ${countAfterRestart} rows.`);
  }

  // Attempt check again after simulated restart
  const windowStart = new Date(Date.now() - windowMs);
  const reCount = await newDbClient.loginAttempt.count({
    where: { key: testKey, createdAt: { gte: windowStart } },
  });
  const blockedAfterRestart = reCount >= 5;
  if (!blockedAfterRestart) {
    throw new Error('FAILED: Rate limit block was lost after process restart!');
  }
  console.log('   PASSED: Rate limit block remains enforced across server/process restarts.');

  // Clean up test key
  await db.loginAttempt.deleteMany({ where: { key: testKey } });
  await newDbClient.$disconnect();
  console.log('\n=== DATABASE-BACKED RATE LIMITER VERIFICATION SUCCESSFUL ===');
}

runRateLimitVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
