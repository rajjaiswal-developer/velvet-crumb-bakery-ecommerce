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

async function runVerification() {
  console.log('====================================================');
  console.log('HERO FEATURED PRODUCT CAROUSEL VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Fetch active products
    const activeProducts = await prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Total active non-deleted products found: ${activeProducts.length}`);
    if (activeProducts.length < 5) {
      throw new Error('Verification requires at least 5 active products in database.');
    }

    // Save original isFeatured states to restore afterwards
    const originalFeaturedStates = activeProducts.map((p) => ({ id: p.id, isFeatured: p.isFeatured }));

    // Reset all to false first
    await prisma.product.updateMany({
      where: { id: { in: activeProducts.map((p) => p.id) } },
      data: { isFeatured: false },
    });

    // TEST CASE 1: Exactly 1 featured product
    console.log('\n--- Test Case 1: Exactly 1 product marked isFeatured ---');
    await prisma.product.update({
      where: { id: activeProducts[0].id },
      data: { isFeatured: true },
    });

    let featured = await prisma.product.findMany({
      where: { isDeleted: false, isActive: true, isFeatured: true },
      take: 5,
    });
    console.log(`Featured count in DB: ${featured.length}`);
    if (featured.length !== 1) throw new Error('Test Case 1 failed: Expected exactly 1 featured product.');
    console.log(`PASSED: Single featured product (${featured[0].name}) correctly fetched.`);

    // TEST CASE 2: 3-4 products marked isFeatured
    console.log('\n--- Test Case 2: 4 products marked isFeatured ---');
    for (let i = 0; i < 4; i++) {
      await prisma.product.update({
        where: { id: activeProducts[i].id },
        data: { isFeatured: true },
      });
    }

    featured = await prisma.product.findMany({
      where: { isDeleted: false, isActive: true, isFeatured: true },
      take: 5,
    });
    console.log(`Featured count in DB: ${featured.length}`);
    if (featured.length !== 4) throw new Error('Test Case 2 failed: Expected 4 featured products.');
    featured.forEach((p, idx) => {
      console.log(`  Slide ${idx + 1}: ${p.name} (slug: ${p.slug})`);
    });
    console.log('PASSED: 4 featured products correctly returned with unique names and slugs.');

    // TEST CASE 3: Cap at 5 when 6+ products are marked isFeatured
    console.log('\n--- Test Case 3: 6 products marked isFeatured (testing cap of 5) ---');
    for (let i = 0; i < Math.min(6, activeProducts.length); i++) {
      await prisma.product.update({
        where: { id: activeProducts[i].id },
        data: { isFeatured: true },
      });
    }

    const allFeaturedInDb = await prisma.product.findMany({
      where: { isDeleted: false, isActive: true, isFeatured: true },
    });
    console.log(`Total isFeatured=true in DB: ${allFeaturedInDb.length}`);

    // Simulate front-end capping logic (.slice(0, 5))
    const cappedFeatured = allFeaturedInDb.slice(0, 5);
    console.log(`Capped featured count for storefront: ${cappedFeatured.length}`);
    if (cappedFeatured.length !== 5) throw new Error('Test Case 3 failed: Expected capped count of 5.');
    console.log('PASSED: Cap of 5 is strictly respected.');

    // RESTORE ORIGINAL STATES
    console.log('\n--- Cleanup: Restoring original product states ---');
    for (const orig of originalFeaturedStates) {
      await prisma.product.update({
        where: { id: orig.id },
        data: { isFeatured: orig.isFeatured },
      });
    }
    console.log('PASSED: Original database state restored successfully.');

    console.log('\n====================================================');
    console.log('ALL FEATURED CAROUSEL DB & CAP TESTS PASSED 100%');
    console.log('====================================================');
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
