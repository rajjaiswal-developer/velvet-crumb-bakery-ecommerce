const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const db = new PrismaClient();

async function backupProductTable() {
  console.log('=== BACKING UP PRODUCT TABLE BEFORE FIX-12 SCHEMA MIGRATION ===');
  const products = await db.product.findMany({
    include: { variants: true, category: true },
  });

  const backupPath = path.join(__dirname, 'backup-products-before-fix-12.json');
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf-8');

  console.log(`Backed up ${products.length} products to ${backupPath}`);
  await db.$disconnect();
}

backupProductTable().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
