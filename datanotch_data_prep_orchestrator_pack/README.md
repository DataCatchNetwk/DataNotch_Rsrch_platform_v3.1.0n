# DataNotch Data Preparation Orchestrator Pack

This pack wires the missing production flow for warehouse/uploaded datasets:

```text
Upload / Warehouse Query / Cloud Import
→ Universal Parser
→ Raw Dataset Registry
→ Data Preparation Engine
→ Clean Dataset Registry
→ Harmonized Dataset
→ Feature Set
→ Workspace
→ Analysis Studio
→ Visualization / Reports / Publication
```

## What is included

- PostgreSQL Prisma schema for dataset registry, assets, workspace links, workflow runs, and stage runs.
- Express API for upload, warehouse-query starter, manual run preparation, download, workspace visibility, and deep healthcheck.
- BullMQ + Redis worker for background data preparation.
- Cleaning engine for CSV parsing, column normalization, type detection, missing-value profiling, duplicate removal, date normalization, PII/PHI risk detection, quality scoring, profile report, and cleaned CSV output.
- Next.js Data Preparation UI page.
- Workspace dataset visibility page.
- Docker compose for PostgreSQL and Redis.

## Install

```bash
cd datanotch_data_prep_orchestrator_pack
cp .env.example .env
cd docker && docker compose up -d
cd ../apps/api
npm install
npx prisma generate --schema ../../prisma/schema.prisma
npx prisma migrate dev --schema ../../prisma/schema.prisma --name data_prep_orchestrator
npm run dev
```

Copy `apps/web/app/data-preparation/page.tsx` and `apps/web/app/workspaces/[workspaceId]/datasets/page.tsx` into your Next.js app.

## Test upload

```bash
./scripts/test-upload.sh
```

Open:

```text
http://localhost:4000/api/health/deep
http://localhost:3000/data-preparation
```

## API endpoints

```text
POST /api/datasets/upload
POST /api/datasets/warehouse-query
GET  /api/datasets
GET  /api/datasets/:id
POST /api/datasets/:id/run-preparation
GET  /api/datasets/:id/download?kind=CLEANED
GET  /api/workspaces/:id/datasets?readyOnly=false
GET  /api/health/deep
```

## Production notes

Replace the starter `warehouse-query` `csvPreview` adapter with your Database Studio query executor. Keep the same orchestration contract: create dataset, save raw artifact, link workspace, create workflow, enqueue worker.

For clinical or sensitive data, keep low-risk cleaning automatic and route PII/PHI, imputation, outliers, and duplicate deletion to reviewer approval when required.
