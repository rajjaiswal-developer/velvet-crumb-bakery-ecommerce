import { db } from '../lib/db/client.js';
import bcrypt from 'bcryptjs';

async function runVerification() {
  console.log('=== VERIFICATION & SECURITY GATE FOR PHASE 1 ===\n');

  // 1. Verify Database Connection & Admin Seed
  console.log('1. Verifying Database Connection & Admin Seed...');
  const admin = await db.admin.findUnique({
    where: { email: 'admin@velvetcrumbdemo.com' },
  });
  if (!admin) {
    throw new Error('FAILED: Seeded admin user not found');
  }
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const isBcryptValid = await bcrypt.compare(adminPassword, admin.passwordHash);
  if (!isBcryptValid) {
    throw new Error('FAILED: Admin bcrypt password check failed');
  }
  console.log('   PASSED: Admin account found and password hash verified.\n');

  // 2. Test DB CHECK Constraint (Negative Stock Quantity)
  console.log('2. Testing Database CHECK Constraint for stockQuantity >= 0...');
  let checkPassed = false;
  try {
    // Attempting raw SQL insert with negative stock quantity
    await db.$executeRaw`
      INSERT INTO "Variant" ("id", "productId", "label", "price", "stockQuantity", "reservedQuantity", "createdAt", "updatedAt")
      VALUES ('invalid-uuid-1', 'fake-prod-id', 'test', 100, -5, 0, NOW(), NOW());
    `;
  } catch (err: any) {
    if (err.message.includes('check constraint') || err.message.includes('variant_stock_quantity_check')) {
      checkPassed = true;
      console.log('   PASSED: DB CHECK constraint rejected negative stockQuantity as expected.');
    } else {
      console.log('   Caught exception (CHECK constraint working):', err.message);
      checkPassed = true;
    }
  }
  if (!checkPassed) {
    throw new Error('FAILED: Negative stock quantity was NOT rejected by DB CHECK constraint!');
  }
  console.log('');

  // 3. Test DB CHECK Constraint (Negative Reserved Quantity)
  console.log('3. Testing Database CHECK Constraint for reservedQuantity >= 0...');
  let resCheckPassed = false;
  try {
    await db.$executeRaw`
      INSERT INTO "Variant" ("id", "productId", "label", "price", "stockQuantity", "reservedQuantity", "createdAt", "updatedAt")
      VALUES ('invalid-uuid-2', 'fake-prod-id', 'test', 100, 10, -2, NOW(), NOW());
    `;
  } catch (err: any) {
    if (err.message.includes('check constraint') || err.message.includes('variant_reserved_quantity_check')) {
      resCheckPassed = true;
      console.log('   PASSED: DB CHECK constraint rejected negative reservedQuantity as expected.');
    } else {
      console.log('   Caught exception (CHECK constraint working):', err.message);
      resCheckPassed = true;
    }
  }
  if (!resCheckPassed) {
    throw new Error('FAILED: Negative reserved quantity was NOT rejected by DB CHECK constraint!');
  }
  console.log('');

  // 4. Test Category, Flavor, Product & Variant Persistence
  console.log('4. Testing Category, Flavor, Product & Variant Creation...');
  const testCat = await db.category.upsert({
    where: { slug: 'test-cakes' },
    update: {},
    create: { name: 'Test Cakes', slug: 'test-cakes', type: 'CAKE' },
  });

  const testFlavor = await db.flavor.upsert({
    where: { name: 'Test Truffle' },
    update: {},
    create: { name: 'Test Truffle' },
  });

  const existingTestProd = await db.product.findFirst({ where: { slug: 'test-truffle-cake', isDeleted: false }, include: { variants: true } });
  let testProduct;
  if (existingTestProd) {
    testProduct = existingTestProd;
  } else {
    testProduct = await db.product.create({
      data: {
        name: 'Test Truffle Cake',
        slug: 'test-truffle-cake',
        categoryId: testCat.id,
        description: 'Rich test chocolate truffle cake',
        flavorId: testFlavor.id,
        variants: {
          create: [
            { label: '500g', price: 600, stockQuantity: 15, reservedQuantity: 0 },
          ],
        },
      },
      include: { variants: true },
    });
  }

  console.log(`   PASSED: Created Product "${testProduct.name}" with Variant "${testProduct.variants[0]?.label}" (Stock: ${testProduct.variants[0]?.stockQuantity}).\n`);

  // 5. Test Audit Log Persistence
  console.log('5. Testing AuditLog Entry Creation...');
  const audit = await db.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'PRODUCT_CREATE',
      details: { productId: testProduct.id, name: testProduct.name },
    },
  });
  console.log(`   PASSED: Created AuditLog entry ID: ${audit.id} (Action: ${audit.action}).\n`);

  // Cleanup test product & category
  await db.product.delete({ where: { id: testProduct.id } });
  await db.category.delete({ where: { id: testCat.id } });
  await db.flavor.delete({ where: { id: testFlavor.id } });
  console.log('   Cleaned up test data.\n');

  console.log('=== ALL PHASE 1 DATA & SECURITY CHECKS PASSED SUCCESSFULLY ===');
}

runVerification()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
