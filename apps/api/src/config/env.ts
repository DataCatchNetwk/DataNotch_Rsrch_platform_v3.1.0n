import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 3001);
const nodeEnv = process.env.NODE_ENV ?? 'development';
const portFallbackEnabled = process.env.PORT_FALLBACK_ENABLED
  ? process.env.PORT_FALLBACK_ENABLED.toLowerCase() !== 'false'
  : nodeEnv !== 'production';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  PORT_FALLBACK_ENABLED: portFallbackEnabled,
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  SERVER_PUBLIC_URL: process.env.SERVER_PUBLIC_URL ?? `http://localhost:${port}`,
  REDIS_URL: process.env.REDIS_URL ?? '',
  QUEUE_BACKEND: (process.env.QUEUE_BACKEND ?? 'postgres').toLowerCase(),
  PIPELINE_EVENT_STREAM_KEY: process.env.PIPELINE_EVENT_STREAM_KEY ?? 'pipeline:events',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET', 'replace-me-in-production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 12),
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
  MICROSOFT_OAUTH_CLIENT_ID: process.env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
  MICROSOFT_OAUTH_CLIENT_SECRET: process.env.MICROSOFT_OAUTH_CLIENT_SECRET ?? '',
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `http://localhost:${port}/api/v1/auth/sso/google/callback`,
  MICROSOFT_OAUTH_REDIRECT_URI: process.env.MICROSOFT_OAUTH_REDIRECT_URI ?? `http://localhost:${port}/api/v1/auth/sso/microsoft/callback`,
  AUTH_NETWORK_BLOCK_ENABLED: (process.env.AUTH_NETWORK_BLOCK_ENABLED ?? 'true').toLowerCase() !== 'false',
  AUTH_NETWORK_FAIL_CLOSED: process.env.AUTH_NETWORK_FAIL_CLOSED
    ? process.env.AUTH_NETWORK_FAIL_CLOSED.toLowerCase() !== 'false'
    : nodeEnv === 'production',
  AUTH_NETWORK_CHECK_URL: process.env.AUTH_NETWORK_CHECK_URL ?? 'https://api.ipapi.is',
  AUTH_NETWORK_CHECK_TIMEOUT_MS: Number(process.env.AUTH_NETWORK_CHECK_TIMEOUT_MS ?? 6000),
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? 'DataNotch Research Platform <no-reply@datanotch.local>',
  SMTP_SECURE: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
};
