import { PrismaClient } from '@prisma/client';
import { cleanupCompanyData } from '../src/config/demo-cleanup';
import { resolveDemoSeedTarget } from '../src/config/demo-seed-target';
import { assertDemoCleanupAllowed } from '../src/config/seed-safety';

assertDemoCleanupAllowed(process.env);

const prisma = new PrismaClient();

async function main() {
  const { admin, company } = await resolveDemoSeedTarget(
    prisma,
    process.env.DEMO_ADMIN_EMAIL ?? 'admin@zayan.test',
  );
  const counts = await prisma.$transaction(
    (transaction) => cleanupCompanyData(transaction, company.id, admin.id),
    { maxWait: 10_000, timeout: 120_000 },
  );
  const deleted = Object.values(counts).reduce(
    (total, count) => total + count,
    0,
  );
  const changedModels = Object.fromEntries(
    Object.entries(counts).filter(([, count]) => count > 0),
  );
  console.log(
    JSON.stringify(
      {
        company: company.name,
        administratorPreserved: admin.email,
        deleted,
        models: changedModels,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
