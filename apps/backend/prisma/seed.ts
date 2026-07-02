import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissionKeys = [
  'dashboard.view',
  'employees.view',
  'employees.create',
  'employees.update',
  'employees.delete',
  'attendance.view',
  'attendance.manage',
  'leaves.view',
  'leaves.request',
  'leaves.approve',
  'payroll.view',
  'payroll.manage',
  'performance.view',
  'performance.manage',
  'recruitment.view',
  'recruitment.manage',
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.delete',
  'tasks.view',
  'tasks.create',
  'tasks.update',
  'tasks.delete',
  'clients.view',
  'clients.create',
  'clients.update',
  'clients.delete',
  'leads.view',
  'leads.create',
  'leads.update',
  'leads.convert',
  'sales.view',
  'sales.manage',
  'billing.view',
  'billing.manage',
  'finance.view',
  'finance.manage',
  'purchases.view',
  'purchases.manage',
  'vendors.view',
  'vendors.manage',
  'inventory.view',
  'inventory.manage',
  'assets.view',
  'assets.manage',
  'documents.view',
  'documents.upload',
  'documents.manage',
  'calendar.view',
  'calendar.manage',
  'communications.view',
  'communications.manage',
  'notifications.view',
  'notifications.manage',
  'approvals.view',
  'approvals.manage',
  'approvals.approve',
  'reports.view',
  'reports.export',
  'helpdesk.view',
  'helpdesk.manage',
  'settings.view',
  'settings.manage',
  'roles.view',
  'roles.manage',
  'permissions.view',
  'permissions.manage',
  'audit_logs.view',
];

function permissionParts(key: string) {
  const [module, action] = key.split('.');
  return { module, action };
}

async function main() {
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Zayan Max',
      legalName: 'Zayan Max',
      email: 'admin@zayan.test',
      phone: '9999999999',
      address: 'Local Development',
    },
  });

  for (const key of permissionKeys) {
    const parts = permissionParts(key);
    await prisma.permission.upsert({
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

  const role = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Super Admin' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Super Admin',
      description: 'Full local development access',
      isSystemRole: true,
    },
  });

  const permissions = await prisma.permission.findMany();
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  const passwordHash = await bcrypt.hash('Password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@zayan.test' },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@zayan.test',
      passwordHash,
      isEmailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
