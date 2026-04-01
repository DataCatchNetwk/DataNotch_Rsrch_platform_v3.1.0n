# Central Data Deposit - Fully Wired Upgrade Pack

This pack upgrades the starter concept into a more complete **shadcn/ui-oriented implementation skeleton** with:

- real modal-based preview UX
- table + card dataset browsing
- domain filters + text search + favorites
- RBAC guard examples for deposit access and pull actions
- queue-backed preview and pull job orchestration
- NestJS endpoints aligned to a research platform control-plane

## Included

- `apps/web`: Next.js App Router pages, components, typed client helpers
- `server`: NestJS data deposit module, DTOs, guards, queue service, controller/service stubs
- `docs`: implementation notes and rollout guidance

## Expected existing dependencies

Frontend:
- Next.js App Router
- shadcn/ui
- lucide-react
- TanStack Table
- React Query or SWR optional

Backend:
- NestJS
- Prisma
- BullMQ / Redis
- class-validator / class-transformer
- your existing auth + RBAC infrastructure

## Main routes

Frontend:
- `/data-deposit`

Backend:
- `GET /api/v1/datasets/deposit`
- `GET /api/v1/datasets/deposit/:id`
- `GET /api/v1/datasets/deposit/:id/preview`
- `POST /api/v1/datasets/deposit/:id/pull`
- `POST /api/v1/datasets/deposit/:id/favorite`

## Notes

This is a **production-leaning scaffold**, not a drop-in complete app. You should align:

- Prisma import paths
- your auth decorator + current user decorator
- queue registration location
- actual object storage / warehouse query logic
- your existing Workspace / Dataset / AnalysisJob models
