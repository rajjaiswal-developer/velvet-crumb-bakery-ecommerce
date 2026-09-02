const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== SEARCHING FOR ROYAL RED VELVET HEART CAKE ===\n');

  // Search by name or partial slug
  const products = await db.product.findMany({
    where: {
      OR: [
        { slug: { contains: 'royal-red-velvet-heart-cake' } },
        { name: { contains: 'Royal Red Velvet' } },
        { name: { contains: 'Red Velvet' } }
      ]
    },
    include: {
      category: true,
      flavor: true,
      variants: true
    }
  });

  console.log(`Found ${products.length} products:`);
  for (const p of products) {
    console.log(JSON.stringify(p, null, 2));
    console.log('--- raw slug inspect ---');
    console.log('slug length:', p.slug.length);
    console.log('slug JSON:', JSON.stringify(p.slug));
    console.log('slug charCodes:', Array.from(p.slug).map(c => c.charCodeAt(0)));

    // Check categoryId
    const cat = await db.category.findUnique({ where: { id: p.categoryId } });
    console.log(`CategoryId ${p.categoryId} exists in DB?`, !!cat, cat ? cat.name : 'ORPHANED');

    // Check flavorId if set
    if (p.flavorId) {
      const flv = await db.flavor.findUnique({ where: { id: p.flavorId } });
      console.log(`FlavorId ${p.flavorId} exists in DB?`, !!flv, flv ? flv.name : 'ORPHANED');
    } else {
      console.log('FlavorId is null/undefined');
    }
  }

  console.log('\n=== ALL PRODUCTS SLUGS & DELETED/ACTIVE STATUS ===');
  const allProducts = await db.product.findMany({
    select: { id: true, name: true, slug: true, isActive: true, isDeleted: true, categoryId: true, flavorId: true }
  });
  for (const ap of allProducts) {
    console.log(`ID: ${ap.id} | Name: "${ap.name}" | Slug: "${ap.slug}" (len:${ap.slug.length}) | active:${ap.isActive} | deleted:${ap.isDeleted} | catId:${ap.categoryId} | flvId:${ap.flavorId}`);
  }

  // Check backup json files if present in scripts/
  const fs = require('fs');
  if (fs.existsSync('scripts/backup-products-before-fix-12.json')) {
    const backup12 = JSON.parse(fs.readFileSync('scripts/backup-products-before-fix-12.json', 'utf8'));
    const oldP = backup12.find(p => p.slug?.includes('royal-red-velvet') || p.name?.includes('Royal Red Velvet'));
    if (oldP) {
      console.log('\n=== BACKUP BEFORE FIX 12 RECORD ===');
      console.log(JSON.stringify(oldP, null, 2));
    }
  }

  await db.$disconnect();
}

main().catch(console.error);
