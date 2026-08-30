export function resolveCorsOrigins(env: NodeJS.ProcessEnv) {
  const configuredOrigins = [
    ...new Set(
      env.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [],
    ),
  ];

  if (configuredOrigins.includes('*')) {
    throw new Error(
      'Wildcard CORS origins are not allowed when credentials are enabled',
    );
  }

  if (configuredOrigins.length) {
    return configuredOrigins;
  }

  if (env.FRONTEND_URL) {
    return [env.FRONTEND_URL];
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS or FRONTEND_URL is required in production');
  }

  return ['http://localhost:3000'];
}
