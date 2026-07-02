# Research Studio Full Logic Pack

This pack upgrades Research Studio from static pages into an action-oriented research design layer that sits after Data Preparation and before Analytics & AI.

Flow:
Workspace → Data Management → Data Preparation → Research Studio → Analytics & AI → Outputs

Includes:
- Unique Next.js pages for Research Questions, Study Design, Cohort Builder, Variable Selection, Protocol Builder, Experiment Setup, Research Workspace, Collaboration Tools
- API client wiring
- Express routes
- Research Studio service logic
- Prisma schema additions
- Handoff endpoints from prepared datasets into Analytics & AI
- Flow documentation

Install by copying the folders into your monorepo:
- `frontend/app/dashboard/research-studio/*` → `apps/web/app/dashboard/research-studio/*`
- `frontend/src/lib/api/research-studio.ts` → `apps/web/src/lib/api/research-studio.ts`
- `backend/src/routes/researchStudio.ts` → `apps/api/src/routes/researchStudio.ts`
- `backend/src/modules/research-studio/*` → `apps/api/src/modules/research-studio/*`
- merge `backend/prisma/research-studio.prisma` into `apps/api/prisma/schema.prisma`

Then wire route in API app:
```ts
import researchStudioRoutes from './routes/researchStudio';
app.use('/api/research-studio', researchStudioRoutes);
```
