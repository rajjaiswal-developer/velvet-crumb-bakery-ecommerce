const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@velvetcrumbdemo.com';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable required');
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  await prisma.shopSettings.upsert({
    where: { id: 'singleton' },
    update: {
      businessName: 'Velvet Crumb Bakery',
      businessAddress: '12 Bakers Lane, Demo City',
      contactEmail: 'hello@velvetcrumbdemo.com',
      whatsappNumber: '9999900000',
      shopLatitude: 19.0760,
      shopLongitude: 72.8777,
    },
    create: {
      id: 'singleton',
      isOpen: true,
      openingHours: '10:00 AM - 10:00 PM',
      contactEmail: 'hello@velvetcrumbdemo.com',
      whatsappNumber: '9999900000',
      deliveryRadiusKm: 5.0,
      businessName: 'Velvet Crumb Bakery',
      businessAddress: '12 Bakers Lane, Demo City',
      shopLatitude: 19.0760,
      shopLongitude: 72.8777,
      socialLinks: {},
    },
  });

  console.log('SUCCESS: Admin user and ShopSettings updated in DB:', admin.email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
