const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkRateLimit(key, limit = 20, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    await db.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: windowStart },
      },
    });
  } catch (err) {
    console.error('Rate limit cleanup error:', err);
  }

  const count = await db.loginAttempt.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  const resetTime = now + windowMs;

  if (count >= limit) {
    return { success: false, remaining: 0, resetTime };
  }

  await db.loginAttempt.create({
    data: { key },
  });

  return { success: true, remaining: limit - (count + 1), resetTime };
}

async function verifyUploadRateLimit() {
  console.log('====================================================');
  console.log('    VERIFICATION GATE: ADMIN UPLOAD RATE LIMIT');
  console.log('====================================================\n');

  const testKey = `upload_admin_test_session_${Date.now()}`;
  const limit = 20;
  const windowMs = 15 * 60 * 1000;

  console.log(`Rate limit configuration being tested:`);
  console.log(`- Key pattern: "upload_admin_<adminId>" (Per Admin Session)`);
  console.log(`- Max allowed attempts: ${limit} uploads`);
  console.log(`- Time window: ${windowMs / 60000} minutes\n`);

  // [TEST 1] Perform 6 consecutive upload attempts (Normal legitimate admin work)
  console.log('[TEST 1] Testing 6 consecutive uploads (Normal admin work session)...');
  let allowedCount = 0;
  for (let i = 1; i <= 6; i++) {
    const result = await checkRateLimit(testKey, limit, windowMs);
    if (result.success) {
      allowedCount++;
    } else {
      throw new Error(`FAILURE: Normal admin upload #${i} was blocked by rate limiter!`);
    }
  }
  console.log(`✓ All ${allowedCount} normal uploads passed successfully without hitting rate limit.\n`);

  // [TEST 2] Continue rapid uploads up to limit (20 total)
  console.log('[TEST 2] Testing rapid uploads up to limit (attempts 7 through 20)...');
  for (let i = 7; i <= limit; i++) {
    const result = await checkRateLimit(testKey, limit, windowMs);
    if (!result.success) {
      throw new Error(`FAILURE: Rapid upload attempt #${i} was prematurely blocked before hitting limit of ${limit}!`);
    }
  }
  console.log(`✓ Upload attempts 7 through ${limit} were correctly allowed.\n`);

  // [TEST 3] Attempt #21 (Should trigger 429 rate limit)
  console.log('[TEST 3] Testing abusive 21st rapid upload attempt (Should be BLOCKED)...');
  const blockedResult = await checkRateLimit(testKey, limit, windowMs);
  if (blockedResult.success) {
    throw new Error('FAILURE: Attempt #21 was NOT blocked by rate limiter!');
  }
  console.log('✓ Attempt #21 was successfully BLOCKED by the rate limiter!\n');

  // Clean up test loginAttempt records created during test
  console.log('Cleaning up test records from database...');
  await db.loginAttempt.deleteMany({
    where: { key: testKey },
  });
  console.log('✓ Cleanup complete.\n');

  console.log('====================================================');
  console.log('  ALL UPLOAD RATE LIMIT VERIFICATION TESTS PASSED!');
  console.log('====================================================');
}

verifyUploadRateLimit()
  .then(async () => {
    await db.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Verification failed:', err);
    await db.$disconnect();
    process.exit(1);
  });
