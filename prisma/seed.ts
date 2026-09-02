import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function geocodeShopAddress(address: string): Promise<{ lat: number; lng: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'mock-google-maps-api-key') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
    } catch (err) {
      console.warn('Geocoding API call during seed failed, using Demo City default coordinates:', err);
    }
  }
  // Default coordinates for 12 Bakers Lane, Demo City
  return { lat: 19.0760, lng: 72.8777 };
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@velvetcrumbdemo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminVelvet#2026!';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
    },
  });

  console.log(`Admin user initialized: ${admin.email}`);

  const fullAddress = '12 Bakers Lane, Demo City, Maharashtra 400086, India';
  const { lat, lng } = await geocodeShopAddress(fullAddress);

  const shopSettings = await prisma.shopSettings.upsert({
    where: { id: 'singleton' },
    update: {
      shopLatitude: lat,
      shopLongitude: lng,
    },
    create: {
      id: 'singleton',
      isOpen: true,
      openingHours: '10:00 AM - 10:00 PM',
      contactEmail: adminEmail,
      whatsappNumber: '9999900000',
      deliveryRadiusKm: 5.0,
      businessName: 'Velvet Crumb Bakery',
      businessAddress: '12 Bakers Lane, Demo City',
      shopLatitude: lat,
      shopLongitude: lng,
      socialLinks: {},
    },
  });

  console.log(`Shop settings initialized: ${shopSettings.businessName} at (${lat}, ${lng})`);

  // 1. Top-Level Categories
  const topCakes = await prisma.category.upsert({
    where: { slug: 'cakes' },
    update: { name: 'Cakes', type: 'CAKE', parentId: null },
    create: { name: 'Cakes', slug: 'cakes', type: 'CAKE', parentId: null },
  });

  const topCelebration = await prisma.category.upsert({
    where: { slug: 'celebration' },
    update: { name: 'Celebration Products', type: 'CELEBRATION', parentId: null },
    create: { name: 'Celebration Products', slug: 'celebration', type: 'CELEBRATION', parentId: null },
  });

  console.log('Top-level categories seeded: Cakes & Celebration Products');

  // 2. Subcategories
  const subBirthday = await prisma.category.upsert({
    where: { slug: 'birthday-cakes' },
    update: { name: 'Birthday Cakes', type: 'CAKE', parentId: topCakes.id },
    create: { name: 'Birthday Cakes', slug: 'birthday-cakes', type: 'CAKE', parentId: topCakes.id },
  });

  const subAnniversary = await prisma.category.upsert({
    where: { slug: 'anniversary-cakes' },
    update: { name: 'Anniversary Cakes', type: 'CAKE', parentId: topCakes.id },
    create: { name: 'Anniversary Cakes', slug: 'anniversary-cakes', type: 'CAKE', parentId: topCakes.id },
  });

  await prisma.category.upsert({
    where: { slug: 'occasion-cakes' },
    update: { name: 'Occasion Cakes', type: 'CAKE', parentId: topCakes.id },
    create: { name: 'Occasion Cakes', slug: 'occasion-cakes', type: 'CAKE', parentId: topCakes.id },
  });

  await prisma.category.upsert({
    where: { slug: 'designer-cakes' },
    update: { name: 'Designer Cakes', type: 'CAKE', parentId: topCakes.id },
    create: { name: 'Designer Cakes', slug: 'designer-cakes', type: 'CAKE', parentId: topCakes.id },
  });

  await prisma.category.upsert({
    where: { slug: 'bouquets-flowers' },
    update: { name: 'Bouquets & Flowers', type: 'CELEBRATION', parentId: topCelebration.id },
    create: { name: 'Bouquets & Flowers', slug: 'bouquets-flowers', type: 'CELEBRATION', parentId: topCelebration.id },
  });

  await prisma.category.upsert({
    where: { slug: 'gifts-hampers' },
    update: { name: 'Gifts & Hampers', type: 'CELEBRATION', parentId: topCelebration.id },
    create: { name: 'Gifts & Hampers', slug: 'gifts-hampers', type: 'CELEBRATION', parentId: topCelebration.id },
  });

  console.log('Subcategories seeded successfully.');

  // 3. Flavors
  const flavors = ['Chocolate Truffle', 'Black Forest', 'Red Velvet', 'Pineapple Fresh Cream', 'Mango Delight'];
  const flavorMap = new Map<string, string>();
  for (const name of flavors) {
    const f = await prisma.flavor.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    flavorMap.set(name, f.id);
  }

  // 4. Sample Products
  const prod1Slug = 'belgian-chocolate-truffle-cake';
  const existingProd1 = await prisma.product.findFirst({ where: { slug: prod1Slug, isDeleted: false } });
  if (existingProd1) {
    await prisma.product.update({
      where: { id: existingProd1.id },
      data: { categoryId: subBirthday.id },
    });
  } else {
    await prisma.product.create({
      data: {
        name: 'Belgian Chocolate Truffle Cake',
        slug: prod1Slug,
        categoryId: subBirthday.id,
        description: 'Rich 100% eggless dark Belgian chocolate truffle cake crafted fresh in Demo City.',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/belgian-truffle.jpg' }],
        flavorId: flavorMap.get('Chocolate Truffle') || null,
        isActive: true,
        isFeatured: true,
        variants: {
          create: [
            { label: '500g', price: 550, stockQuantity: 15 },
            { label: '1kg', price: 990, stockQuantity: 10 },
            { label: '2kg', price: 1850, stockQuantity: 5 },
          ],
        },
      },
    });
  }

  const prod2Slug = 'royal-red-velvet-heart-cake';
  const existingProd2 = await prisma.product.findFirst({ where: { slug: prod2Slug, isDeleted: false } });
  if (existingProd2) {
    await prisma.product.update({
      where: { id: existingProd2.id },
      data: { categoryId: subAnniversary.id },
    });
  } else {
    await prisma.product.create({
      data: {
        name: 'Royal Red Velvet Heart Cake',
        slug: prod2Slug,
        categoryId: subAnniversary.id,
        description: 'Velvety cream cheese layers in heart shape, 100% pure vegetarian.',
        images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/red-velvet-heart.jpg' }],
        flavorId: flavorMap.get('Red Velvet') || null,
        isActive: true,
        isFeatured: false,
        variants: {
          create: [
            { label: '500g', price: 650, stockQuantity: 12 },
            { label: '1kg', price: 1150, stockQuantity: 8 },
          ],
        },
      },
    });
  }

  console.log('Sample products seeded under subcategories.');

  const templates = [
    {
      key: 'ORDER_CONFIRMATION_EMAIL',
      subject: 'Order Receipt #{{receiptNumber}} - Velvet Crumb Bakery',
      body: `<div style="font-family: Arial, sans-serif; background-color: #FFF8F0; padding: 20px; color: #1B1F3B;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #E8DCCB;">
      <h2 style="color: #F0791A; margin-top: 0;">Velvet Crumb Bakery - Order Receipt</h2>
      <p>Dear {{customerName}},</p>
      <p>Thank you for ordering with Velvet Crumb Bakery! Your order <strong>#{{receiptNumber}}</strong> has been confirmed on {{orderDate}}.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #FFF8F0; text-align: left;">
            <th style="padding: 8px;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{itemsTable}}
        </tbody>
      </table>

      <p><strong>Delivery Fee:</strong> ₹0 (Free 5 km Delivery)</p>
      <p style="font-size: 18px; color: #F0791A;"><strong>Total Amount Paid:</strong> {{totalAmount}}</p>
      <p><strong>Delivery Time Slot:</strong> {{deliveryTimeSlot}}</p>
      <p><strong>Delivery Address:</strong> {{shippingAddress}}</p>
      <p><em>{{specialInstructions}}</em></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6B6B6B;">100% Eggless Pure Vegetarian Bakery • 12 Bakers Lane, Demo City</p>
    </div>
  </div>`,
    },
    {
      key: 'ORDER_CONFIRMATION',
      subject: 'Order Confirmation - Velvet Crumb Bakery',
      body: 'Dear {{customerName}}, your order {{receiptNumber}} has been received.',
    },
    {
      key: 'PAYMENT_SUCCESS',
      subject: 'Payment Successful - Velvet Crumb Bakery',
      body: 'Dear {{customerName}}, payment for order {{receiptNumber}} was successful.',
    },
    {
      key: 'PAYMENT_FAILED',
      subject: 'Payment Failed - Velvet Crumb Bakery',
      body: 'Dear {{customerName}}, payment for order {{receiptNumber}} failed. Please try again.',
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { key: template.key },
      update: { subject: template.subject, body: template.body },
      create: template,
    });
  }

  // 5. Serviceable Areas (13 Localities within 5km of Bakery)
  const initialLocalities = [
    'Demo City',
    'Demo City East',
    'Vidyavihar West',
    'Vidyavihar East',
    'Vikhroli West',
    'Vikhroli East',
    'Kurla East',
    'Asalpha',
    'Pant Nagar',
    'Rajawadi',
    'Garodia Nagar',
    'Chembur',
    'Powai',
  ];

  for (const name of initialLocalities) {
    await prisma.serviceableArea.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  console.log('Serviceable areas (13 localities) seeded successfully.');

  console.log('Notification templates initialized.');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
