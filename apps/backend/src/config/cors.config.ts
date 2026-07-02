export function resolveCorsOrigins(env: NodeJS.ProcessEnv) {
  const configuredOrigins = env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  if (env.FRONTEND_URL) {
    return [env.FRONTEND_URL];
  }

  return true;
}
