import {
  defineRailway,
  github,
  postgres,
  project,
  redis,
  service,
} from 'railway/iac';

export default defineRailway((ctx) => {
  const database = postgres('PostgreSQL');
  const cache = redis('Redis');

  const backend = service('zayanmax-backend', {
    source: github('zayanmax/zayanmax', {
      branch: 'main',
      rootDirectory: 'apps/backend',
    }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'npm run build:railway',
    },
    start: 'npm run start:prod',
    preDeploy: 'npm run prisma:migrate:deploy',
    healthcheck: '/api/v1/health/ready',
    healthcheckTimeout: 30,
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: database.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      JWT_ACCESS_SECRET: ctx.shared.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: ctx.shared.JWT_REFRESH_SECRET,
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
      CORS_ORIGINS: ctx.shared.CORS_ORIGINS,
      SWAGGER_ENABLED: ctx.isEnvironment('production') ? 'false' : 'true',
    },
  });

  const frontend = service('zayanmax-frontend', {
    source: github('zayanmax/zayanmax', {
      branch: 'main',
      rootDirectory: 'apps/frontend',
    }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'npm run build',
    },
    start: 'npm run start',
    healthcheck: '/api/health',
    healthcheckTimeout: 30,
    env: {
      NEXT_PUBLIC_API_BASE_URL: ctx.shared.NEXT_PUBLIC_API_BASE_URL,
    },
  });

  return project('ZayanMax', {
    resources: [database, cache, backend, frontend],
  });
});
