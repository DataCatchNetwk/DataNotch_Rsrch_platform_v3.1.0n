# Dataset Registry Unique Pages Integration Pack

This pack replaces repeated Dataset Registry placeholder pages with unique, wired pages for the research data lifecycle:

- Raw Datasets
- Clean Datasets
- Harmonized Datasets
- Feature Sets
- Dataset Lineage
- Data Catalog

It includes:

- Next.js frontend route replacement: `apps/web/app/dashboard/datasets/page.tsx`
- Reusable dataset registry UI components
- Frontend API client: `apps/web/src/lib/api/dataset-registry.ts`
- Express backend routes: `apps/api/src/routes/dataset-registry.ts`
- Dataset registry service: `apps/api/src/modules/datasets/dataset-registry.service.ts`
- Prisma schema additions
- Integration instructions

## Correct information flow

```text
Data Sources
  ↓
Database Studio / Raw File Library
  ↓
Raw Datasets
  ↓
Clean Datasets
  ↓
Harmonized Datasets
  ↓
Feature Sets
  ↓
Research Studio / Analysis Studio
  ↓
Visualization / Publication
  ↓
Lineage / Audit
```

## Frontend integration

Copy:

```text
apps/web/app/dashboard/datasets/page.tsx
apps/web/components/datasets/*
apps/web/src/lib/api/dataset-registry.ts
```

into your existing app.

## Backend integration

Copy:

```text
apps/api/src/routes/dataset-registry.ts
apps/api/src/modules/datasets/dataset-registry.service.ts
```

Then mount in your API server:

```ts
import datasetRegistryRoutes from './routes/dataset-registry';
app.use('/api/dataset-registry', datasetRegistryRoutes);
```

## Prisma integration

Merge `apps/api/prisma/dataset-registry-models.prisma` into your existing `schema.prisma`, then run:

```bash
npx prisma migrate dev --name dataset_registry_unique_pages
npx prisma generate
```

## Endpoints

```text
GET  /api/dataset-registry/summary
GET  /api/dataset-registry/raw
GET  /api/dataset-registry/clean
GET  /api/dataset-registry/harmonized
GET  /api/dataset-registry/features
GET  /api/dataset-registry/lineage
GET  /api/dataset-registry/catalog
POST /api/dataset-registry/:id/handoff
POST /api/dataset-registry/:id/profile
POST /api/dataset-registry/:id/request-access
```
