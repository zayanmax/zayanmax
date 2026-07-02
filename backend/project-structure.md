# Backend Project Structure

Recommended backend: NestJS + TypeScript + Prisma + PostgreSQL + Redis + BullMQ.

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── env.validation.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── storage.config.ts
│   │   └── jwt.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── utils/
│   │   └── constants/
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── companies/
│   │   ├── branches/
│   │   ├── departments/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leaves/
│   │   ├── payroll/
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── clients/
│   │   ├── leads/
│   │   ├── finance/
│   │   ├── purchases/
│   │   ├── vendors/
│   │   ├── inventory/
│   │   ├── assets/
│   │   ├── documents/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   ├── calendar/
│   │   ├── helpdesk/
│   │   ├── reports/
│   │   ├── audit-logs/
│   │   └── settings/
│   ├── jobs/
│   │   ├── queues.module.ts
│   │   ├── processors/
│   │   └── producers/
│   └── integrations/
│       ├── email/
│       ├── whatsapp/
│       ├── sms/
│       ├── storage/
│       ├── biometric/
│       └── calendar/
├── test/
├── package.json
├── tsconfig.json
└── .env.example
```

## Module Internal Structure

Each major module should follow this pattern:

```text
clients/
├── clients.module.ts
├── clients.controller.ts
├── clients.service.ts
├── clients.repository.ts
├── dto/
│   ├── create-client.dto.ts
│   ├── update-client.dto.ts
│   └── client-query.dto.ts
├── entities/
│   └── client.entity.ts
├── enums/
│   └── client-status.enum.ts
└── clients.permissions.ts
```

## Naming Rules

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- DTOs: `*.dto.ts`
- Enums: `*.enum.ts`
- Guards: `*.guard.ts`
- Decorators: `*.decorator.ts`
- Queue processors: `*.processor.ts`

## Environment Variables

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/zayan_max
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
STORAGE_PROVIDER=s3
S3_BUCKET=zayan-max
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
EMAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=
```
