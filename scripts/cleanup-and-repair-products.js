const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function cleanupAndRepairProducts() {
  console.log('=== TASK 1: CLEANUP & REPAIR PRODUCTS ===\n');

  const products = await db.product.findMany();
  console.log(`Found ${products.length} products total in database.`);

  let updatedCount = 0;

  for (const product of products) {
    let needsUpdate = false;
    let newDescription = product.description;
    let newName = product.name;
    let newImages = product.images;

    // 1. Check description for test markers
    if (newDescription && /(Verified Fix-|\(Verified|TEST)/i.test(newDescription)) {
      needsUpdate = true;
      // Strip repeated test markers
      newDescription = newDescription
        .replace(/(\s*\(?Verified Fix-\d+\)?)+/gi, '')
        .replace(/(\s*\(?Verified\)?)+/gi, '')
        .trim();
    }

    // 2. Check name for test markers
    if (newName && /(Verified Fix-|\(Verified)/i.test(newName)) {
      needsUpdate = true;
      newName = newName
        .replace(/(\s*\(?Verified Fix-\d+\)?)+/gi, '')
        .replace(/(\s*\(?Verified\)?)+/gi, '')
        .trim();
    }

    // 3. Check images for fix09-test-p*.jpg test URLs
    if (Array.isArray(product.images)) {
      const hasTestImage = product.images.some((img) => {
        const url = typeof img === 'string' ? img : img?.url || '';
        return url.includes('fix09-test-p') || url.includes('fix06-updated') || url.includes('fix06-test');
      });

      if (hasTestImage) {
        needsUpdate = true;
        // If product has valid image like images__1__L8mXhdC3w.jpg, keep it, otherwise set to []
        const validImages = product.images.filter((img) => {
          const url = typeof img === 'string' ? img : img?.url || '';
          return !url.includes('fix09-test-p') && !url.includes('fix06-updated') && !url.includes('fix06-test');
        });

        newImages = validImages;
      }
    }

    if (needsUpdate) {
      console.log(`Cleaning Product "${product.name}" (ID: ${product.id})`);
      console.log(`  Old Description: "${product.description}"`);
      console.log(`  New Description: "${newDescription}"`);
      console.log(`  Old Images: ${JSON.stringify(product.images)}`);
      console.log(`  New Images: ${JSON.stringify(newImages)}\n`);

      await db.product.update({
        where: { id: product.id },
        data: {
          name: newName,
          description: newDescription,
          images: newImages,
        },
      });

      updatedCount++;
    }
  }

  console.log(`Cleanup complete! Total products updated: ${updatedCount}`);
  await db.$disconnect();
}

cleanupAndRepairProducts().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
