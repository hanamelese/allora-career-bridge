import 'dotenv/config';

/**
 * Settings come from the environment. The JWT secret has no default: a
 * server that signs tokens with a well-known key is not a server with
 * authentication, so it refuses to start instead.
 */
function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not set. Copy API/.env.example to API/.env and fill it in.`,
    );
  }

  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? './data/onboarding.db',
  jwtSecret: process.env.NODE_ENV === 'test' ? 'test-secret' : required('JWT_SECRET'),
  tokenLifetime: process.env.TOKEN_LIFETIME ?? '2h',
  /* Only these origins may call the API from a browser. */
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
