type SeedEnvironment = Partial<
  Pick<
    NodeJS.ProcessEnv,
    'NODE_ENV' | 'ALLOW_DEVELOPMENT_SEED' | 'ALLOW_DEMO_SEED'
  >
>;

export function assertDevelopmentSeedAllowed(env: SeedEnvironment) {
  if (env.NODE_ENV === 'production' && env.ALLOW_DEVELOPMENT_SEED !== 'true') {
    throw new Error(
      'Development seed is disabled in production. Set ALLOW_DEVELOPMENT_SEED=true only in an intentional demo/staging environment.',
    );
  }
}

export function assertDemoSeedAllowed(env: SeedEnvironment) {
  if (env.NODE_ENV === 'production' && env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Demo seed is disabled in production. Set ALLOW_DEMO_SEED=true only in an intentional demo/staging environment.',
    );
  }
}
