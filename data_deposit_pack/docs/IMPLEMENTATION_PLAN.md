# Central Data Deposit + Domain Grid + Analysis Platform

## Proposed Architecture

This pack implements the five-component plan:

1. **Extend Dataset Model (Database)**
   - Add domain/category metadata, deposit status, visibility, license, source provenance, preview metadata, and favorite/bookmark support.
2. **Data Deposit Catalog API (Backend)**
   - Add `/api/v1/datasets/deposit` endpoints for public discovery, filtering, preview, favorite toggling, and pull-to-workspace.
3. **Data Grid UI Component (Frontend)**
   - Discoverable, filterable browse page with search, domain filters, cards/table grid, preview modal, and pull workflow.
4. **Dataset Ingestion Pipeline (Backend)**
   - Manual and scheduled ingestion jobs from APIs/files into raw → curated → analytics-ready zones.
5. **Analysis Integration (Frontend + Backend)**
   - Pulled datasets connect to `AnalysisJob`, visualization, reporting, and export flows.

## Quick Start Implementation (3 Priority Tiers)

### 🔴 Tier 1 (Week 1) — MVP Data Discovery
- Extend `Dataset` Prisma schema with deposit metadata
- Create `/api/v1/datasets/deposit/public`
- Build Data Grid page with cards, search, domain filter
- Add `Pull to Workspace`

### 🟡 Tier 2 (Week 2) — Enhanced Discovery
- Add preview modal and preview API
- Add metadata display and dataset favorites
- Add ingestion service skeleton and provider registry
- Add access logging for discovery and pulls

### 🟢 Tier 3 (Week 3+) — Advanced Features
- Daily scheduled ingestion from CDC, WHO, Census, etc.
- Data lineage and version graph
- License / DUA management
- Approval-based restricted access
- Usage analytics and semantic search

## Routes Included

### Frontend
- `/data-deposit`
- `/data-deposit/[datasetId]` (stub noted in structure)

### Backend
- `GET /api/v1/datasets/deposit/public`
- `GET /api/v1/datasets/deposit/:id`
- `GET /api/v1/datasets/deposit/:id/preview`
- `POST /api/v1/datasets/deposit/:id/pull`
- `POST /api/v1/datasets/deposit/:id/favorite`
- `DELETE /api/v1/datasets/deposit/:id/favorite`

## Integration Notes

- Keep the **central deposit read-only**.
- Use `WorkspaceDataset` / `DatasetPullRequest` records for copies or virtualized pulls.
- Add policy checks before allowing restricted domains.
- Route all heavy previewing, profiling, and pull jobs through the worker queue.

## Recommended Next Step

Wire the module to your existing:
- `Dataset`
- `Workspace`
- `AnalysisJob`
- `Report`
- `Notification`
- RBAC / policy guard system

