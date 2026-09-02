import { db } from '@/lib/db/client';

export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    // Opportunistic cleanup of expired login attempts older than the window
    await db.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: windowStart },
      },
    });
  } catch (err) {
    console.error('Rate limit cleanup error:', err);
  }

  // Count recent login attempts in the database within the rolling window
  const count = await db.loginAttempt.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  const resetTime = now + windowMs;

  if (count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime,
    };
  }

  // Record this new attempt in the database
  await db.loginAttempt.create({
    data: {
      key,
    },
  });

  return {
    success: true,
    remaining: limit - (count + 1),
    resetTime,
  };
}
