# Outputs Full Logic Pack

Final module for the Research Platform lifecycle:

Workspace → Data Management → Data Preparation → Research Studio → Analytics & AI → Outputs

This pack adds modern, unique output pages and working API/server wiring for:

- Interactive Dashboards
- Visualization Studio
- Reports
- Publications
- Manuscripts
- Executive Summaries
- Presentations
- Data Exports
- Model Exports
- API Outputs

## Install

Copy files into your monorepo:

```bash
cp -R apps/web/* /path/to/repo/apps/web/
cp -R apps/api/* /path/to/repo/apps/api/
```

Then add the Prisma models in `prisma/schema.prisma`, run migration, and mount routes.

```bash
cd apps/api
npx prisma migrate dev --name outputs_module
npm run dev
```

## Flow

Analytics job results become output assets. Output assets can be rendered as dashboards, figures, reports, manuscripts, presentations, exports, or API payloads.
