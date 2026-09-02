const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== RECENT AUDIT LOGS ===');
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  for (const l of logs) {
    console.log(`[${l.createdAt.toISOString()}] ${l.action}: ${JSON.stringify(l.details)}`);
  }

  await db.$disconnect();
}

main().catch(console.error);
