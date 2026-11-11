const { PrismaClient } = require('@prisma/client');
const { hashPassword, isLegacyPassword } = require('../src/lib/passwords');

const prisma = new PrismaClient();

async function migrate() {
  const users = await prisma.user.findMany({ select: { id: true, passwordHash: true } });
  let migrated = 0;
  for (const { id, passwordHash } of users) {
    if (!isLegacyPassword(passwordHash)) continue;
    const result = await prisma.user.updateMany({
      where: { id, passwordHash },
      data: { passwordHash: await hashPassword(passwordHash) },
    });
    migrated += result.count;
  }

  const remaining = await prisma.user.count({
    where: { NOT: { passwordHash: { startsWith: 'scrypt-v1$' } } },
  });
  console.log(`Passwords migrated: ${migrated}. Legacy passwords remaining: ${remaining}.`);
  if (remaining) process.exitCode = 1;
}

migrate()
  .catch(() => {
    console.error('Password migration failed. Correct the database connection and retry.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
