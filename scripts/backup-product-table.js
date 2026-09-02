const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const db = new PrismaClient();

async function backupProductTable() {
  console.log('=== PRODUCT TABLE BACKUP START ===');
  const products = await db.product.findMany({
    include: {
      variants: true,
      category: true,
    },
  });

  const backupDir = path.join(__dirname, '..', 'scripts');
  const backupFile = path.join(backupDir, 'backup-products-before-fix-06.json');

  const backupData = {
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products: products,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Successfully backed up ${products.length} product(s) to: ${backupFile}`);
  await db.$disconnect();
  return backupFile;
}

if (require.main === module) {
  backupProductTable().catch((err) => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
}

module.exports = { backupProductTable };
