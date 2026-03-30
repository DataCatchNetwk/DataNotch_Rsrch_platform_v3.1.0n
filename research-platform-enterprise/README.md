# Research Platform Enterprise Starter

Monorepo starter for a research data platform with:
- NestJS API
- Prisma + PostgreSQL
- S3-compatible object storage
- multipart dataset uploads
- worker-based file reading and artifact generation
- Next.js App Router + shadcn-style UI pages

## Structure

- `apps/api` — NestJS backend
- `apps/web` — Next.js frontend

## Quick start

### API

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Web

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

## Notes

- Storage defaults to S3-compatible APIs. MinIO works in local environments.
- Queue service is written with a simple interface so you can replace it with BullMQ/Redis.
- Auth guard is stubbed for JWT payload usage and easy replacement with your existing auth system.
