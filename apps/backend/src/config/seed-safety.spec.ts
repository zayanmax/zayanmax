import {
  assertDemoCleanupAllowed,
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

  it('blocks demo cleanup without both production confirmations', () => {
    expect(() => assertDemoCleanupAllowed({ NODE_ENV: 'production' })).toThrow(
      'Demo cleanup is disabled in production',
    );

    expect(() =>
      assertDemoCleanupAllowed({
        NODE_ENV: 'production',
        ALLOW_DEMO_CLEANUP: 'true',
      }),
    ).toThrow('Confirm demo cleanup');
  });

  it('allows demo cleanup only with the exact confirmation phrase', () => {
    expect(() =>
      assertDemoCleanupAllowed({
        NODE_ENV: 'production',
        ALLOW_DEMO_CLEANUP: 'true',
        CONFIRM_DEMO_CLEANUP: 'DELETE_ZAYANMAX_DEMO_DATA',
      }),
    ).not.toThrow();
  });
});
