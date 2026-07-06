# Installation

## Frontend

Copy:

```text
frontend/components/platform/* → apps/web/components/platform/
frontend/lib/platformApi.ts → apps/web/lib/platformApi.ts
frontend/app/dashboard/* → apps/web/app/dashboard/
```

Restart Next.js:

```bash
cd apps/web
npm run dev
```

## Backend

Copy:

```text
backend/src/routes/* → apps/api/src/routes/
backend/src/services/* → apps/api/src/services/
```

Register routers in your API app:

```ts
app.use('/api/platform', platformRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/system', systemRouter);
```

## Prisma

Merge `prisma/schema.prisma` into your root Prisma schema.

```bash
npx prisma migrate dev --name cross_layer_platform
npx prisma generate
```

## Required environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>?schema=public
```
