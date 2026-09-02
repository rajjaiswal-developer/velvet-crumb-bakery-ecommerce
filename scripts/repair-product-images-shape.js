const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const db = new PrismaClient();

async function repairProductImagesShape() {
  console.log('=== PRODUCT IMAGES SHAPE MIGRATION REPAIR ===\n');

  // 1. Verify backup file exists
  const backupFile = path.join(__dirname, 'backup-products-before-fix-06.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(
      `ABORTED: Backup file not found at "${backupFile}". Run node scripts/backup-product-table.js first!`
    );
  }
  console.log(`Verified backup file exists: "${backupFile}"`);

  // 2. Fetch all products
  const products = await db.product.findMany();
  console.log(`Found ${products.length} product(s) in database.\n`);

  let repairedCount = 0;

  for (const product of products) {
    const rawImages = product.images;
    let needsRepair = false;
    let repairedImages = [];

    if (Array.isArray(rawImages)) {
      for (const item of rawImages) {
        if (typeof item === 'string') {
          needsRepair = true;
          repairedImages.push({ url: item });
        } else if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
          repairedImages.push({
            url: item.url,
            fileId: typeof item.fileId === 'string' ? item.fileId : undefined,
          });
        }
      }
    }

    if (needsRepair) {
      console.log(`Repairing Product "${product.name}" (ID: ${product.id})`);
      console.log(`  Before:`, JSON.stringify(rawImages));
      console.log(`  After: `, JSON.stringify(repairedImages));

      await db.product.update({
        where: { id: product.id },
        data: {
          images: repairedImages,
        },
      });

      repairedCount++;
      console.log('  -> Update successful.\n');
    } else {
      console.log(`Product "${product.name}" (ID: ${product.id}): already in valid shape or empty.`);
    }
  }

  console.log(`\nMigration completed. Total products repaired: ${repairedCount}`);
  await db.$disconnect();
  return repairedCount;
}

if (require.main === module) {
  repairProductImagesShape().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { repairProductImagesShape };
