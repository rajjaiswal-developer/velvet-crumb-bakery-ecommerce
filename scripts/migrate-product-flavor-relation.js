const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function backfillFlavorId() {
  console.log('=== BACKFILLING FLAVOR ID ON PRODUCTS ===\n');

  const flavors = await db.flavor.findMany();
  const flavorMap = new Map(flavors.map((f) => [f.name, f.id]));

  console.log('Available Flavors in DB:');
  flavors.forEach((f) => console.log(` - "${f.name}": ID ${f.id}`));

  const products = await db.product.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, flavor: true, flavorId: true },
  });

  console.log(`\nProcessing ${products.length} active products...`);

  let matchedCount = 0;
  let unflavoredCount = 0;
  const unmatchedList = [];

  for (const p of products) {
    if (!p.flavor) {
      unflavoredCount++;
      console.log(` - Product "${p.name}" (ID: ${p.id}): Unflavored (null/empty) -> flavorId set to null.`);
      await db.product.update({
        where: { id: p.id },
        data: { flavorId: null },
      });
    } else {
      const flavorId = flavorMap.get(p.flavor);
      if (flavorId) {
        matchedCount++;
        console.log(` - Product "${p.name}" (ID: ${p.id}): Flavor "${p.flavor}" -> Matched flavorId: ${flavorId}`);
        await db.product.update({
          where: { id: p.id },
          data: { flavorId },
        });
      } else {
        unmatchedList.push({ id: p.id, name: p.name, flavorString: p.flavor });
        console.log(` - WARNING: Product "${p.name}" (ID: ${p.id}): Flavor string "${p.flavor}" UNMATCHED.`);
      }
    }
  }

  console.log('\n=== BACKFILL SUMMARY ===');
  console.log(`Total Active Products Processed: ${products.length}`);
  console.log(`Successfully Matched Products: ${matchedCount}`);
  console.log(`Unflavored Products (null): ${unflavoredCount}`);
  console.log(`Unmatched Products Count: ${unmatchedList.length}`);

  if (unmatchedList.length > 0) {
    console.log('\nUNMATCHED PRODUCTS DETAILS:');
    unmatchedList.forEach((u) => console.log(` - ID: ${u.id} | Name: "${u.name}" | Original Flavor String: "${u.flavorString}"`));
    throw new Error(`FAIL: Found ${unmatchedList.length} unmatched product flavor string(s)!`);
  } else {
    console.log('\nSUCCESS: 100% of products backfilled with accurate flavorId values!');
  }

  await db.$disconnect();
}

backfillFlavorId().catch((err) => {
  console.error(err);
  process.exit(1);
});
