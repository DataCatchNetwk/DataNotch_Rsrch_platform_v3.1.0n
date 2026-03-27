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
  const port = process.env.DATABASE_PORT ?? '3306';
  const user = requireEnv('DATABASE_USER', 'root');
  const password = process.env.DATABASE_PASSWORD ?? '';
  const name = requireEnv('DATABASE_NAME', 'health_data');

  const credentials = password ? `${user}:${password}` : user;
  return `mysql://${credentials}@${host}:${port}/${name}`;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  DATABASE_URL: buildDatabaseUrl(),
  JWT_SECRET: requireEnv('JWT_SECRET', 'replace-me-in-production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 12),
};
