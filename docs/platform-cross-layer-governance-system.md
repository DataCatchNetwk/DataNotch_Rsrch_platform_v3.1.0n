# Platform Cross-Layer Upgrade

## Scope

This upgrade implements a full platform shell for:

- Workspace Intake
- Data Management
- Data Preparation
- Research Studio
- Analytics & AI
- Outputs

with cross-cutting layers:

- Governance Layer
- System Services Layer

## Frontend additions

New shared shell components:

- `apps/web/components/platform/platform-shell.tsx`
- `apps/web/components/platform/stage-page.tsx`

New lifecycle root pages:

- `apps/web/app/dashboard/workspace-intake/page.tsx`
- `apps/web/app/dashboard/data-management/page.tsx`
- `apps/web/app/dashboard/data-preparation/page.tsx`
- `apps/web/app/dashboard/research-studio/page.tsx`
- `apps/web/app/dashboard/analytics-ai/page.tsx`
- `apps/web/app/dashboard/outputs/page.tsx`

New cross-cutting pages:

- `apps/web/app/dashboard/governance/page.tsx`
- `apps/web/app/dashboard/system-services/page.tsx`

New API client:

- `apps/web/src/lib/api/platform-cross-layer.ts`

## Backend additions

New service:

- `apps/api/src/services/platform-cross-layer.service.ts`

New routes:

- `apps/api/src/routes/platform-cross-layer.ts`
- `apps/api/src/routes/governance-cross-layer.ts`
- `apps/api/src/routes/system-services-cross-layer.ts`

Route wiring added in:

- `apps/api/src/app.ts`

Mounted endpoints:

- `/api/platform` and `/api/v1/platform`
- `/api/governance` and `/api/v1/governance`
- `/api/system` and `/api/v1/system`

## Prisma models

Added to `apps/api/prisma/schema.prisma`:

- `PlatformHandoff`
- `GovernanceAuditEvent`
- `GovernanceLineageEvent`
- `SystemJob`
- `SystemNotification`
- `PlatformStorageObject`

## Handoff wiring behavior

`POST /api/platform/handoff` now creates (when Prisma client is generated for these models):

- platform handoff record
- governance lineage event
- governance audit event
- system job

The response includes all generated records for downstream UI and workflow tracing.

## Required post-merge steps

1. Generate and migrate Prisma schema:
   - `pnpm --dir apps/api prisma migrate dev --name platform_cross_layer_flow`
   - `pnpm --dir apps/api prisma generate`
2. Restart API and web apps.
3. Validate routes:
   - `GET /api/platform/overview`
   - `GET /api/governance/audit`
   - `GET /api/system/jobs`

## Notes

- Lifecycle root pages are shell-level entry points designed to route into your existing detailed pages.
- Governance and System Services are implemented as cross-cutting layers, not terminal stages.
