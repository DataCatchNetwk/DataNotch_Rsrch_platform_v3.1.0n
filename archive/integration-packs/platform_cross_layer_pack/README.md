# DataNotch Research Platform: Cross-Layer Full Pages Pack

This pack implements the complete platform flow:

Workspace Intake → Data Management → Data Preparation → Research Studio → Analytics & AI → Outputs

with cross-cutting:

Governance Layer and System Services Layer.

## Included

- Next.js/React pages for every major module
- Shared workflow shell and lifecycle navigation
- API client wiring
- Express/FastAPI-style backend route examples
- Prisma schema additions
- Service logic for handoffs, audit, lineage, jobs, notifications
- Integration guide

## Frontend target paths

Copy `frontend/app/dashboard/*` into your `apps/web/app/dashboard/` folder.

## Backend target paths

Copy `backend/src/*` into your API server.

## Prisma

Merge `prisma/schema.prisma` models into your current schema, then run:

```bash
npx prisma migrate dev --name platform_cross_layer_flow
npx prisma generate
```

## Main flow

1. Workspace Intake receives uploads, ZIP files, database imports, API imports, and team actions.
2. Data Management registers raw, clean, harmonized, and feature datasets.
3. Data Preparation profiles, cleans, harmonizes, engineers features, validates quality, and versions datasets.
4. Research Studio turns prepared datasets into research questions, protocols, cohorts, variables, and experiments.
5. Analytics & AI runs statistics, ML, causal, survival, time series, graph, explainability, digital twin, and counterfactual analysis.
6. Outputs renders dashboards, visualizations, reports, publications, manuscripts, presentations, exports, and API outputs.
7. Governance and System Services monitor and govern every stage.
