import {
  assertDemoSeedAllowed,
  assertDevelopmentSeedAllowed,
} from './seed-safety';

describe('seed safety', () => {
  it('blocks the development seed in production without explicit opt-in', () => {
    expect(() =>
      assertDevelopmentSeedAllowed({ NODE_ENV: 'production' }),
    ).toThrow('Development seed is disabled in production');
  });

  it('blocks the demo seed in production without explicit opt-in', () => {
    expect(() => assertDemoSeedAllowed({ NODE_ENV: 'production' })).toThrow(
      'Demo seed is disabled in production',
    );
  });

  it('allows explicit demo/staging seed opt-in', () => {
    expect(() =>
      assertDevelopmentSeedAllowed({
        NODE_ENV: 'production',
        ALLOW_DEVELOPMENT_SEED: 'true',
      }),
    ).not.toThrow();
    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: 'production',
        ALLOW_DEMO_SEED: 'true',
      }),
    ).not.toThrow();
  });
});
