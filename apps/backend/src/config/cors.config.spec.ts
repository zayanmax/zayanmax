import { resolveCorsOrigins } from './cors.config';

describe('resolveCorsOrigins', () => {
  it('uses CORS_ORIGINS when multiple frontend origins are configured', () => {
    expect(
      resolveCorsOrigins({
        FRONTEND_URL: 'http://localhost:3000',
        CORS_ORIGINS:
          'http://localhost:3000, http://localhost:5173,https://app.zayan.test',
      }),
    ).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
      'https://app.zayan.test',
    ]);
  });

  it('falls back to FRONTEND_URL and then permissive local development behavior', () => {
    expect(
      resolveCorsOrigins({ FRONTEND_URL: 'http://localhost:5173' }),
    ).toEqual(['http://localhost:5173']);
    expect(resolveCorsOrigins({})).toEqual(['http://localhost:3000']);
  });

  it('requires an explicit allowlist in production', () => {
    expect(() => resolveCorsOrigins({ NODE_ENV: 'production' })).toThrow(
      'CORS_ORIGINS or FRONTEND_URL is required in production',
    );
  });

  it('rejects wildcard CORS when credentials are enabled', () => {
    expect(() =>
      resolveCorsOrigins({ NODE_ENV: 'production', CORS_ORIGINS: '*' }),
    ).toThrow('Wildcard CORS origins are not allowed');
  });

  it('trims and de-duplicates configured origins', () => {
    expect(
      resolveCorsOrigins({
        CORS_ORIGINS:
          'https://app.zayanmax.com, https://app.zayanmax.com,https://admin.zayanmax.com',
      }),
    ).toEqual(['https://app.zayanmax.com', 'https://admin.zayanmax.com']);
  });
});
