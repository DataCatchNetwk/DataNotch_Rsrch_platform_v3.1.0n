# Data Management Full Pages Integration Pack

This pack upgrades the Research Platform V3 Data Management layer with unique, action-oriented pages and backend wiring.

## Flow implemented

Workspace Intake → Raw File Library → Data Sources → Database Studio → Dataset Registry → Raw Datasets → Data Preparation

## Included frontend pages

Copy into your Next.js app:

- `apps/web/app/dashboard/files/page.tsx`
- `apps/web/app/dashboard/data-sources/page.tsx`
- `apps/web/app/dashboard/database/page.tsx`
- `apps/web/app/dashboard/datasets/page.tsx`
- `apps/web/src/lib/api/data-management.ts`

## Included backend

Copy into your API server:

- `server/src/routes/dataManagement.ts`
- `server/src/modules/data-management/data-management.service.ts`
- `server/prisma/data-management.prisma.addon`

## Wire backend

In `server/src/app.ts` or your Express route bootstrap:

```ts
import dataManagementRoutes from './routes/dataManagement';
app.use('/api/data-management', dataManagementRoutes);
```

## Wire frontend navigation

Routes:

```txt
/dashboard/files
/dashboard/data-sources
/dashboard/database
/dashboard/datasets?view=registry
/dashboard/datasets?view=raw
/dashboard/datasets?view=clean
/dashboard/datasets?view=harmonized
/dashboard/datasets?view=features
/dashboard/datasets?view=lineage
/dashboard/datasets?view=catalog
```

## Workspace handoff API

Workspace upload/extraction should call:

```http
POST /api/data-management/workspace-handoff
```

Payload:

```json
{
  "workspaceId": "workspace-001",
  "archiveId": "archive-001",
  "files": [
    { "name": "sdoh.csv", "type": "csv", "path": "/storage/workspaces/ws/sdoh.csv" }
  ]
}
```

Then the service creates raw file assets and dataset candidates. Users can register candidates as raw datasets.
