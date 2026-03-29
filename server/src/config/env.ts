import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function buildDatabaseUrl(): string {
  // If DATABASE_URL is set directly, use it as-is
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = requireEnv('DATABASE_HOST', 'localhost');
  const port = process.env.DATABASE_PORT ?? '5432';
  const user = requireEnv('DATABASE_USER', 'postgres');
  const password = process.env.DATABASE_PASSWORD ?? '';
  const name = requireEnv('DATABASE_NAME', 'health_data');

  const credentials = password ? `${user}:${password}` : user;
  return `postgresql://${credentials}@${host}:${port}/${name}?schema=public`;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  DATABASE_URL: buildDatabaseUrl(),
  JWT_SECRET: requireEnv('JWT_SECRET', 'replace-me-in-production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 12),
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
  MICROSOFT_OAUTH_CLIENT_ID: process.env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
  MICROSOFT_OAUTH_CLIENT_SECRET: process.env.MICROSOFT_OAUTH_CLIENT_SECRET ?? '',
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? 'http://localhost:3001/api/v1/auth/sso/google/callback',
  MICROSOFT_OAUTH_REDIRECT_URI: process.env.MICROSOFT_OAUTH_REDIRECT_URI ?? 'http://localhost:3001/api/v1/auth/sso/microsoft/callback',
};
