const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany({
    include: { parent: true, children: true, _count: { select: { products: true } } }
  });
  console.log('=== CATEGORIES (' + categories.length + ') ===');
  categories.forEach(c => {
    console.log(`[${c.id}] ${c.name} (slug: ${c.slug}, type: ${c.type}, parentId: ${c.parentId}, products: ${c._count.products})`);
  });

  const products = await prisma.product.findMany({
    include: { category: true, flavor: true, variants: true }
  });
  console.log('\n=== PRODUCTS (' + products.length + ') ===');
  products.forEach(p => {
    console.log(`\nProduct ID: ${p.id}`);
    console.log(`  Name: ${p.name}`);
    console.log(`  Slug: ${p.slug}`);
    console.log(`  Category: ${p.category?.name} (${p.category?.slug})`);
    console.log(`  Flavor: ${p.flavor?.name || 'None'}`);
    console.log(`  Description: ${p.description}`);
    console.log(`  Active: ${p.isActive}, Deleted: ${p.isDeleted}, Featured: ${p.isFeatured}`);
    console.log(`  Images: ${JSON.stringify(p.images)}`);
    console.log(`  SEO Title: ${p.seoTitle || 'N/A'}`);
    console.log(`  Meta Desc: ${p.metaDescription || 'N/A'}`);
    console.log(`  Variants (${p.variants.length}):`);
    p.variants.forEach(v => {
      console.log(`    - ID: ${v.id} | Label: ${v.label} | Price: ₹${v.price} | Stock: ${v.stockQuantity} | Reserved: ${v.reservedQuantity}`);
    });
  });

  const flavors = await prisma.flavor.findMany();
  console.log('\n=== FLAVORS (' + flavors.length + ') ===');
  flavors.forEach(f => console.log(`- ${f.name} (ID: ${f.id})`));

  await prisma.$disconnect();
}

run().catch(console.error);
