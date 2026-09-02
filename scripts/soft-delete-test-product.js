const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function softDeleteTestProduct() {
  const id = '57497354-4925-44b0-a0d7-91ff12d5f1a7';
  const existing = await db.product.findUnique({ where: { id } });
  if (existing) {
    const updated = await db.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
    console.log(`Soft-deleted test product: "${updated.name}" (ID: ${updated.id}, isDeleted: ${updated.isDeleted})`);
  } else {
    console.log(`Test product ID ${id} not found or already removed.`);
  }

  await db.$disconnect();
}

softDeleteTestProduct().catch((err) => {
  console.error(err);
  process.exit(1);
});
