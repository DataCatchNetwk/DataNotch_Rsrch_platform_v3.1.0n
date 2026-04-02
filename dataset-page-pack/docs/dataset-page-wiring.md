# Dataset Page Wiring Summary

## Frontend coverage

The page includes:

- grid + table toggle
- filters + search
- dataset cards
- preview modal
- pull modal
- favorites
- workspace integration
- API wiring

## Mapped sections

- Dataset Library
- Data Deposit (Global Catalog)
- Workspace Datasets
- Cohort Builder
- Data Operations
- Analysis Launcher
- Versions & Lineage
- Access & Governance
- Favorites

## Backend endpoints

- `GET /api/v1/datasets`
- `POST /api/v1/datasets/:datasetId/favorite`
- `POST /api/v1/datasets/:datasetId/pull`

## Suggested next upgrade

Add these when you merge into the main platform:

- preview endpoint with schema, sample rows, and file artifact metadata
- cohort builder launch action
- lineage graph API
- access request workflow modal
- bulk operations for archive, export, governance policy apply
- saved views and pinned filters
- live processing status via SSE/WebSocket
