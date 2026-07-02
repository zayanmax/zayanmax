# Deployment Guide

## Recommended Environments

- Local development
- Staging
- Production

## Services Needed

```text
Frontend: Next.js
Backend: NestJS
Database: PostgreSQL
Cache/Queue: Redis
Storage: S3-compatible bucket
Search: Meilisearch/OpenSearch
Monitoring: Sentry or similar
Logs: Cloud logs or self-hosted log stack
```

## Docker Compose for Local Development

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: zayan
      POSTGRES_PASSWORD: zayan
      POSTGRES_DB: zayan_max
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  meilisearch:
    image: getmeili/meilisearch:v1.8
    ports:
      - "7700:7700"
```

## Backend Deployment

Build:

```bash
npm run build
```

Run migrations:

```bash
npx prisma migrate deploy
```

Start:

```bash
node dist/main.js
```

## Frontend Deployment

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

## Production Rules

- Use HTTPS only.
- Use managed PostgreSQL if possible.
- Enable automated database backups.
- Store secrets in environment variables or secret manager.
- Never commit `.env` files.
- Enable error tracking.
- Enable audit logs.
- Use object storage lifecycle policies for old files.

## Backup Strategy

- Database: daily automated backup, 30-day retention.
- Files: bucket versioning if possible.
- Critical exports: store generated reports with expiry.

## Monitoring

Track:
- API error rate
- API latency
- Queue failures
- Database CPU/storage
- Redis memory
- Failed login attempts
- File upload failures
