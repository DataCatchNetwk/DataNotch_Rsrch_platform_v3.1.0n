# Workspace Intake Upgrade Pack

This pack upgrades the Workspaces page from an informational list into a real **Workspace Intake Console**.

## What it adds

- Workspace Intake page with:
  - ZIP upload
  - folder/file upload placeholder
  - database import handoff
  - API import handoff
  - Workspace File Explorer
  - extracted folder tree
  - detected dataset candidates
  - project creation
  - task creation
  - team assignment
  - dataset registration
  - next-chain handoff into Data Management → Dataset Registry → Data Preparation

## Integration targets

Frontend:
- `apps/web/app/dashboard/workspaces/page.tsx`
- `apps/web/src/lib/api/workspace-intake.ts`

Backend:
- `apps/api/src/routes/workspace-intake.routes.ts`
- `apps/api/src/modules/workspace-intake/workspace-intake.service.ts`
- `apps/api/src/modules/workspace-intake/workspace-intake.types.ts`

Prisma:
- `apps/api/prisma/workspace-intake.prisma.append`

## Main flow

```text
WORKSPACES
  ↓
ZIP / Folder / CSV / XLSX / JSON / Parquet Upload
  ↓
Workspace File Explorer
  ↓
Detected Dataset Candidates
  ↓
Register Dataset
  ↓
Dataset Registry / Raw Datasets
  ↓
Data Profiling
  ↓
Cleaning & Wrangling
  ↓
Research Studio
  ↓
Analytics & AI
  ↓
Outputs
```

## API endpoints

```http
GET    /api/workspace-intake/summary
GET    /api/workspace-intake/workspaces
POST   /api/workspace-intake/workspaces
POST   /api/workspace-intake/workspaces/:workspaceId/upload
GET    /api/workspace-intake/workspaces/:workspaceId/files
GET    /api/workspace-intake/workspaces/:workspaceId/candidates
POST   /api/workspace-intake/workspaces/:workspaceId/register-dataset
POST   /api/workspace-intake/workspaces/:workspaceId/projects
POST   /api/workspace-intake/workspaces/:workspaceId/tasks
POST   /api/workspace-intake/workspaces/:workspaceId/team
POST   /api/workspace-intake/workspaces/:workspaceId/handoff
```

## Install backend dependencies

```bash
cd apps/api
npm install multer unzipper fast-glob
```

## Install frontend dependencies

No required new dependency. Uses normal React/Next components and `fetch`.

## Register route

In `apps/api/src/app.ts` or your route loader:

```ts
import workspaceIntakeRoutes from "./routes/workspace-intake.routes";

app.use("/api/workspace-intake", workspaceIntakeRoutes);
```

## Prisma

Copy the content of:

```text
apps/api/prisma/workspace-intake.prisma.append
```

into your existing `schema.prisma`, then run:

```bash
npx prisma migrate dev --name workspace_intake_upgrade
npx prisma generate
```
