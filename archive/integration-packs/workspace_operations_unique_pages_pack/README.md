# Workspace Operations Unique Pages Integration Pack

This pack replaces information-only Workspace pages with action-driven modules:

- Workspaces: operational research containers with create/open/handoff actions
- Projects: objectives, milestones, deliverables, dataset links, and pipeline launch
- Tasks: Kanban board for research operations, reviews, governance, and blockers
- Runtime Monitoring: live pipeline/job observability and controls

## Flow

Workspace -> Project -> Task -> Data Management -> Data Preparation -> Research Studio -> Analytics & AI -> Outputs -> Governance -> System

## Install

Copy folders into your repo:

```bash
cp -r apps/web/app/dashboard/* <repo>/apps/web/app/dashboard/
cp -r apps/web/src/lib/api/* <repo>/apps/web/src/lib/api/
cp -r apps/api/src/routes/* <repo>/apps/api/src/routes/
cp -r apps/api/src/services/* <repo>/apps/api/src/services/
```

Add routes in your API server:

```ts
import workspaceOpsRoutes from './routes/workspace-ops.routes';
app.use('/api/workspace-ops', workspaceOpsRoutes);
```

Run Prisma migration after merging schema additions from `apps/api/prisma/workspace_ops_schema.prisma`.

## Primary API Routes

- GET /api/workspace-ops/summary
- GET /api/workspace-ops/workspaces
- POST /api/workspace-ops/workspaces
- POST /api/workspace-ops/workspaces/:id/handoff
- GET /api/workspace-ops/projects
- POST /api/workspace-ops/projects
- POST /api/workspace-ops/projects/:id/milestones
- GET /api/workspace-ops/tasks
- POST /api/workspace-ops/tasks
- PATCH /api/workspace-ops/tasks/:id/status
- GET /api/workspace-ops/pipelines
- POST /api/workspace-ops/pipelines/:id/action

## Design Intent

These pages should not just explain the stage. They should let the user create, assign, trigger, review, approve, and hand off work across the platform.
