# DataNotch Industrial Readiness Runbook

This runbook covers the production-readiness layer for the ten implementation areas: auth, database, workers, communication, admin operations, frontend reliability, security, observability, testing, and deployment.

## Runtime Requirements

- Node.js 22+
- pnpm 9+
- PostgreSQL 15+
- Redis is optional. Set `QUEUE_BACKEND=redis` and `REDIS_URL` only when BullMQ is required. The platform defaults to PostgreSQL worker jobs.

## Required Environment

Copy `.env.example` and set production secrets before deployment.

Critical values:

- `JWT_SECRET`: must be a strong secret in production.
- `DATABASE_URL` or `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`.
- `QUEUE_BACKEND=postgres` for PostgreSQL-backed worker jobs, or `QUEUE_BACKEND=redis` with `REDIS_URL`.
- `AUTH_NETWORK_FAIL_CLOSED=true` in production if external network reputation checks are mandatory.
- `RATE_LIMIT_ENABLED=true`, `RATE_LIMIT_MAX`, and `AUTH_RATE_LIMIT_MAX` for API protection.

## Database Readiness

Run migrations and generate the Prisma client:

```bash
pnpm --dir server prisma:generate
pnpm --dir server prisma:migrate
```

Check health:

```bash
curl http://localhost:3001/api/v1/ops/health
```

## Worker Readiness

PostgreSQL worker mode is the safe local/default mode:

```bash
QUEUE_BACKEND=postgres pnpm --dir server worker
```

Redis/BullMQ mode is optional:

```bash
QUEUE_BACKEND=redis REDIS_URL=redis://localhost:6379 pnpm --dir server worker
```

Admins can inspect, retry, and cancel jobs from `/admin/operations`.

## Launch

Start the API and worker:

```bash
pnpm --dir server dev
pnpm --dir server worker
```

Start the web app:

```bash
pnpm --dir my-app dev
```

Open:

- Web: http://localhost:3000
- API health: http://localhost:3001/api/v1/ops/health
- Admin operations: http://localhost:3000/admin/operations

## Validation

Run local checks before deployment:

```bash
pnpm --dir server build
pnpm --dir my-app exec tsc --noEmit
node scripts/healthcheck.mjs
node scripts/smoke-communication.mjs
```

## Deployment Guardrails

- Run database migrations before starting the new server image.
- Keep `AUTH_NETWORK_FAIL_CLOSED=false` only for development or offline labs.
- Keep Redis optional unless the production queue architecture requires BullMQ.
- Monitor `/api/v1/ops/health` from the platform load balancer.
- Use `/admin/operations` for queue recovery, runtime posture, and deployment recommendations.