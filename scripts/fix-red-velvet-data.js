const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== FIXING DATABASE PRODUCT DATA ===\n');

  // Fix Royal Red Velvet Heart Cake
  const redVelvet = await db.product.findUnique({
    where: { id: '3f856e21-34ca-4689-85be-0d2097e3ef6a' }
  });

  if (redVelvet) {
    console.log(`Product ID: ${redVelvet.id}`);
    console.log(`Old slug: "${redVelvet.slug}" (len: ${redVelvet.slug.length})`);
    const cleanSlug = redVelvet.slug.trim();

    const updated = await db.product.update({
      where: { id: redVelvet.id },
      data: { slug: cleanSlug }
    });
    console.log(`New slug: "${updated.slug}" (len: ${updated.slug.length})`);
    console.log(`isActive: ${updated.isActive}, isDeleted: ${updated.isDeleted}`);
  } else {
    console.log('Product 3f856e21-34ca-4689-85be-0d2097e3ef6a not found!');
  }

  // Audit all other products for leading/trailing whitespace in slug or name
  console.log('\n=== AUDITING ALL PRODUCTS IN DATABASE FOR WHITESPACE ISSUES ===');
  const allProducts = await db.product.findMany();
  let fixCount = 0;

  for (const p of allProducts) {
    const trimmedSlug = p.slug.trim();
    const trimmedName = p.name.trim();

    if (p.slug !== trimmedSlug || p.name !== trimmedName) {
      console.log(`Fixing product ID ${p.id}:`);
      console.log(`  Name: "${p.name}" -> "${trimmedName}"`);
      console.log(`  Slug: "${p.slug}" -> "${trimmedSlug}"`);

      await db.product.update({
        where: { id: p.id },
        data: { name: trimmedName, slug: trimmedSlug }
      });
      fixCount++;
    }
  }

  console.log(`\nAudit complete. Fixed ${fixCount} additional product(s).`);

  await db.$disconnect();
}

main().catch(console.error);
