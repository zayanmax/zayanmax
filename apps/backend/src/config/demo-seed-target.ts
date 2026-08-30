type DemoSeedAdmin = {
  id: string;
  companyId: string;
  email: string;
};

type DemoSeedCompany = {
  id: string;
  name: string;
};

type DemoSeedTargetClient = {
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true; companyId: true; email: true };
    }): Promise<DemoSeedAdmin | null>;
  };
  company: {
    findUnique(args: {
      where: { id: string };
    }): Promise<DemoSeedCompany | null>;
  };
};

export async function resolveDemoSeedTarget(
  prisma: DemoSeedTargetClient,
  adminEmail: string,
) {
  const email = adminEmail.trim().toLowerCase();
  const admin = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyId: true, email: true },
  });
  if (!admin) {
    throw new Error(`Demo administrator ${email} was not found.`);
  }

  const company = await prisma.company.findUnique({
    where: { id: admin.companyId },
  });
  if (!company) {
    throw new Error(`Company ${admin.companyId} for ${email} was not found.`);
  }

  return { admin, company };
}
