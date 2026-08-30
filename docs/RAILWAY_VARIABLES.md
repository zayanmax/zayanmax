# ZayanMax Railway Variables

The authoritative project graph is [`../.railway/railway.ts`](../.railway/railway.ts).
It references Railway-managed PostgreSQL and Redis variables directly and reads
cross-service values from Railway shared variables. Never commit the real values.

## Application variables

| Variable | Service | Required | Secret | Example | Purpose |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | Backend | Yes | No | `production` | Enables production validation and disables Swagger unless explicitly enabled. Set by IaC. |
| `PORT` | Backend and frontend | Yes | No | Railway-provided | Dynamic listening port supplied by Railway. Do not set a fixed production value. |
| `DATABASE_URL` | Backend | Yes | Yes | PostgreSQL reference | Prisma connection string. IaC maps `PostgreSQL.DATABASE_URL`; no public database endpoint is needed. |
| `REDIS_URL` | Backend | Yes for readiness | Yes | Redis reference | IaC maps `Redis.REDIS_URL`. Current code checks Redis reachability for readiness but has no queue/cache worker. |
| `JWT_ACCESS_SECRET` | Backend shared variable | Yes | Yes | Generate at least 32 random characters | Access-token signing secret. Production startup rejects missing, short, placeholder, or reused values. |
| `JWT_REFRESH_SECRET` | Backend shared variable | Yes | Yes | Generate a different value of at least 32 random characters | Refresh-token signing secret. Must differ from the access secret. |
| `JWT_ACCESS_EXPIRES_IN` | Backend | Yes | No | `15m` | Access-token lifetime. Set by IaC. |
| `JWT_REFRESH_EXPIRES_IN` | Backend | Yes | No | `30d` | Refresh-token lifetime. Set by IaC. |
| `CORS_ORIGINS` | Backend shared variable | Yes | No | `https://frontend.example` | Comma-separated exact browser origins. Wildcard is rejected. Use the generated frontend domain first, then the custom domain when available. |
| `FRONTEND_URL` | Backend | Alternative | No | `https://frontend.example` | Single-origin fallback used only when `CORS_ORIGINS` is absent. IaC uses `CORS_ORIGINS`. |
| `SWAGGER_ENABLED` | Backend | No | No | `false` | IaC sets `false` in Production and `true` in other Railway environments. |
| `BUILD_VERSION` | Backend | No | No | `0.0.1` | Optional health/OpenAPI build metadata. |
| `BUILD_SHA` | Backend | No | No | `commit-sha` | Optional health metadata. |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend shared variable | Yes at build | No | `https://backend.example/api/v1` | Public HTTPS API URL used by browser code. It is embedded during `next build`; changing it requires a new frontend build/deployment. Never use a `.railway.internal` address. |
| `STORAGE_PROVIDER` | Backend | No | No | `s3` | Reserved optional configuration only; no persistent binary storage provider is implemented. Do not set it expecting uploads to work. |

## Manual seed and bootstrap variables

These are not normal service runtime configuration and are not managed by IaC.
Set them only for the one command that needs them, then remove them.

| Variable | Command/environment | Required | Secret | Example | Purpose |
| --- | --- | --- | --- | --- | --- |
| `ALLOW_DEVELOPMENT_SEED` | Demo/Staging only | Yes for dev seed under `NODE_ENV=production` | No | `true` | Explicitly permits the known local admin/development base seed. Never set in Production. |
| `ALLOW_DEMO_SEED` | Demo/Staging only | Yes for demo seed under `NODE_ENV=production` | No | `true` | Explicitly permits fake operational/demo data. Never set in Production. |
| `BOOTSTRAP_COMPANY_NAME` | Production bootstrap | Yes | No | `Example Company` | Initial company display name. |
| `BOOTSTRAP_COMPANY_LEGAL_NAME` | Production bootstrap | No | No | `Example Company Private Limited` | Optional initial legal name. |
| `BOOTSTRAP_ADMIN_EMAIL` | Production bootstrap | Yes | No | `owner@example.com` | Initial administrator email. No default exists. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Production bootstrap | Yes | Yes | Generate a unique password of at least 14 characters | One-time administrator password. Remove the variable after bootstrap. |

## Railway references

The IaC graph applies these references without exposing credentials:

```text
zayanmax-backend.DATABASE_URL -> PostgreSQL.DATABASE_URL
zayanmax-backend.REDIS_URL    -> Redis.REDIS_URL
```

The following shared variables must exist in each Railway environment before an
IaC plan/apply can resolve them:

```text
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
CORS_ORIGINS
NEXT_PUBLIC_API_BASE_URL
```

Demo/Staging and Production must have separate secret values and separate data.
