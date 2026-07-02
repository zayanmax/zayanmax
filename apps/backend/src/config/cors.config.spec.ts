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
    expect(resolveCorsOrigins({})).toBe(true);
  });
});
