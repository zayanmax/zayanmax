# Database Notes

## Database Stack

- PostgreSQL
- Prisma
- UUID primary keys

## Global Columns

Most business tables should include:

```text
id
companyId
branchId
createdAt
updatedAt
deletedAt
createdById
updatedById
```

`branchId`, `deletedAt`, `createdById`, and `updatedById` can be nullable depending on the table.

## Isolation Rule

Every business query must scope by `companyId` unless it is an explicit system-level super admin operation.

## Soft Delete

Use soft delete for business records where historical/audit value matters.

## Indexing Baseline

Add indexes for:

- `companyId`
- `branchId`
- `status`
- `createdAt`
- `employeeId`
- `clientId`
- `projectId`
- `date`
- searchable fields such as `email`, `phone`, `employeeCode`, and `invoiceNumber`

## Initial Seed Data

Seed:

- First company.
- Super admin user.
- Default roles.
- Permission keys from `backend/permissions-seed.md`.
- Role-permission assignments for the initial admin role.
