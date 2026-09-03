const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@velvetcrumbdemo.com';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable must be set in .env');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // 1. Reset Admin Credentials
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  // 2. Clear Login Attempts (Rate Limit)
  const deletedAttempts = await prisma.loginAttempt.deleteMany({});

  console.log(`SUCCESS: Admin email set to: ${admin.email}`);
  console.log(`SUCCESS: Password hash successfully updated in database.`);
  console.log(`SUCCESS: Cleared ${deletedAttempts.count} rate limit login attempt record(s).`);
}

main()
  .catch((err) => {
    console.error('ERROR during reset:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
