# Data Preparation Unique Pages Integration Pack

This pack replaces repeated Data Preparation pages with unique, wired pages for:
- Data Profiling
- Cleaning & Wrangling
- Harmonization
- Feature Engineering
- Quality Validation
- Dataset Versioning

It also adds the workflow handoff:

Database Studio → Create Dataset → Dataset Registry → Data Profiling → Cleaning → Harmonization → Feature Engineering → Quality Validation → Dataset Versioning → Analysis Studio

## Install

Copy files into your monorepo:

```bash
cp -R apps/web/* ../../apps/web/
cp -R apps/api/* ../../apps/api/
```

Add API routes in `apps/api/src/app.ts` or your Express router:

```ts
import dataPreparationRoutes from './routes/data-preparation';
app.use('/api/data-preparation', dataPreparationRoutes);
```

Add Prisma models from `apps/api/prisma/data-preparation.prisma` into your main `schema.prisma`, then run:

```bash
pnpm --filter api prisma migrate dev --name data_preparation_workflow
pnpm --filter api prisma generate
```

## Frontend routes

Each page is route/query driven:

```text
/dashboard/datasets?prep=profiling
/dashboard/datasets?prep=cleaning
/dashboard/datasets?prep=harmonization
/dashboard/datasets?prep=features
/dashboard/datasets?prep=quality
/dashboard/datasets?prep=versions
```

For cleaner routes, you may also mount them as:

```text
/dashboard/data-preparation/profiling
/dashboard/data-preparation/cleaning
/dashboard/data-preparation/harmonization
/dashboard/data-preparation/feature-engineering
/dashboard/data-preparation/quality-validation
/dashboard/data-preparation/versioning
```
