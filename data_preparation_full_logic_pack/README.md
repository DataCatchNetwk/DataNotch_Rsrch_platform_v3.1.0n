# Data Preparation Full Logic Pack

This pack upgrades the Data Preparation layer into a full research data preparation engine.

Flow:

```text
Workspace Intake
  → Data Management
  → Dataset Registry
  → Data Preparation
      → Data Profiling
      → Cleaning & Wrangling
      → Harmonization
      → Feature Engineering
      → Quality Validation
      → Dataset Versioning
  → Research Studio
```

## What is included

```text
apps/web/
  app/dashboard/data-preparation/page.tsx
  app/dashboard/data-preparation/profiling/page.tsx
  app/dashboard/data-preparation/cleaning/page.tsx
  app/dashboard/data-preparation/harmonization/page.tsx
  app/dashboard/data-preparation/features/page.tsx
  app/dashboard/data-preparation/quality/page.tsx
  app/dashboard/data-preparation/versioning/page.tsx
  src/lib/api/data-preparation.ts
  src/components/data-preparation/*

apps/api/
  src/routes/data-preparation.ts
  src/modules/data-preparation/
    data-preparation.service.ts
    profiling.engine.ts
    cleaning.engine.ts
    harmonization.engine.ts
    feature-engineering.engine.ts
    quality-validation.engine.ts
    versioning.engine.ts
    handoff.service.ts
    data-preparation.types.ts
  prisma/data-preparation.prisma.append
```

## Integration steps

1. Copy `apps/web/*` into your Next.js frontend.
2. Copy `apps/api/*` into your backend.
3. Append `apps/api/prisma/data-preparation.prisma.append` into `server/prisma/schema.prisma`.
4. Register route in your API app:

```ts
import dataPreparationRouter from './routes/data-preparation';
app.use('/api/data-preparation', dataPreparationRouter);
```

5. Add frontend nav links:

```text
/dashboard/data-preparation/profiling
/dashboard/data-preparation/cleaning
/dashboard/data-preparation/harmonization
/dashboard/data-preparation/features
/dashboard/data-preparation/quality
/dashboard/data-preparation/versioning
```

## Main APIs

```http
GET  /api/data-preparation/overview
GET  /api/data-preparation/stage/:stage
POST /api/data-preparation/profiling/run
POST /api/data-preparation/cleaning/run
POST /api/data-preparation/harmonization/run
POST /api/data-preparation/features/run
POST /api/data-preparation/quality/run
POST /api/data-preparation/versioning/create
POST /api/data-preparation/handoff/research-studio
```
