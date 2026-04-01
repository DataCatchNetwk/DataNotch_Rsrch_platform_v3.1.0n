# Downloadable Starter Pack: Data Deposit + Domain Grid + Analysis Platform

This pack gives you a practical starter structure for the proposal:

- Prisma schema additions for central deposit metadata
- NestJS `data-deposit` module with catalog, preview, favorite, and pull endpoints
- Ingestion service and pull worker skeletons
- Next.js data grid page and API client
- Implementation plan and rollout notes

## Suggested merge order
1. Merge Prisma additions into your existing schema
2. Generate migration and update inverse relations on `User` / `Workspace`
3. Register `DataDepositModule` in your NestJS app
4. Add the `data-deposit` route to your sidebar
5. Replace the simple HTML inputs with your existing shadcn/ui components
6. Connect pull requests to your queue/job system
7. Connect completed pulls to `AnalysisJob` creation

## Important assumptions
- `PrismaService` lives at `@/common/prisma/prisma.service`
- Existing `User` and `Workspace` models already exist
- `req.user.id` is populated by your auth guard
- Tailwind aliases (`@/`) are already configured in the web app

## Best next upgrade
- Real DTO validation around access policies
- Restricted dataset approval workflow
- Shadcn modal/table polish
- Warehouse-backed preview instead of JSON preview rows
- Analysis launch action after successful pull
