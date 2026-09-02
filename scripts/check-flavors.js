const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function check() {
  const products = await db.product.findMany({
    select: { id: true, name: true, flavor: true },
  });
  const flavors = await db.flavor.findMany();
  const flavorNames = new Set(flavors.map((f) => f.name));

  console.log('=== EMPIRICAL FLAVOR AUDIT BEFORE MIGRATION ===');
  console.log('Total products in DB:', products.length);
  console.log('Total flavor records in DB:', flavors.length);
  console.log('Flavor names in DB:', Array.from(flavorNames));

  let matched = 0;
  let unflavored = 0;
  const unmatched = [];

  for (const p of products) {
    if (!p.flavor) {
      unflavored++;
    } else if (flavorNames.has(p.flavor)) {
      matched++;
    } else {
      unmatched.push(p);
    }
  }

  console.log('Matched products:', matched);
  console.log('Unflavored (null/empty) products:', unflavored);
  console.log('Unmatched products count:', unmatched.length);

  if (unmatched.length > 0) {
    console.log('Unmatched products detail:');
    unmatched.forEach((p) => console.log(` - ID: ${p.id} | Name: "${p.name}" | Flavor String: "${p.flavor}"`));
  } else {
    console.log('Zero unmatched products found.');
  }

  await db.$disconnect();
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
