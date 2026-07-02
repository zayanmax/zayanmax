import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('returns typed environment values when required settings are valid', () => {
    const env = validateEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgresql://zayan:zayan@localhost:5432/zayan_max',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
    });

    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('rejects missing JWT secrets', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://zayan:zayan@localhost:5432/zayan_max',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow('Environment validation failed');
  });
});
