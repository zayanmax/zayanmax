import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { permissionKeys, permissionParts } from './permission-keys';

const prisma = new PrismaClient();

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for production bootstrap`);
  return value;
}

function validatePassword(password: string) {
  if (password.length < 14) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 14 characters');
  }
  if (password.toLowerCase() === 'password123') {
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD cannot use development credentials',
    );
  }
}

async function main() {
  const companyName = required('BOOTSTRAP_COMPANY_NAME');
  const adminEmail = required('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('BOOTSTRAP_ADMIN_PASSWORD');
  validatePassword(adminPassword);

  if (!/^\S+@\S+\.\S+$/.test(adminEmail)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.$transaction(async (transaction) => {
    const existingUser = await transaction.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new Error(
        'Bootstrap admin already exists; no credentials were changed',
      );
    }

    const company = await transaction.company.create({
      data: {
        name: companyName,
        legalName:
          process.env.BOOTSTRAP_COMPANY_LEGAL_NAME?.trim() || companyName,
        email: adminEmail,
      },
    });

    for (const key of permissionKeys) {
      const parts = permissionParts(key);
      await transaction.permission.upsert({
        where: { key },
        update: {},
        create: {
          key,
          module: parts.module,
          action: parts.action,
          description: `${parts.module} ${parts.action}`,
        },
      });
    }

    const role = await transaction.role.create({
      data: {
        companyId: company.id,
        name: 'Super Admin',
        description: 'Initial production administrator',
        isSystemRole: true,
      },
    });
    const permissions = await transaction.permission.findMany({
      select: { id: true },
    });
    await transaction.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
    const user = await transaction.user.create({
      data: {
        companyId: company.id,
        email: adminEmail,
        passwordHash,
        isEmailVerified: true,
      },
    });
    await transaction.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });
  });

  console.log(`Production bootstrap completed for ${adminEmail}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Bootstrap failed');
    await prisma.$disconnect();
    process.exit(1);
  });
