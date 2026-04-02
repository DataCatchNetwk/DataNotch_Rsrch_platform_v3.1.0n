# Final Dataset Page Pack

Production-style starter pack for a research platform datasets area.

## Included sections

- 📦 Dataset Library
- 🌍 Data Deposit (Global Catalog)
- 🧪 Workspace Datasets
- 🧬 Cohort Builder
- ⚙️ Data Operations
- 📊 Analysis Launcher
- 🔁 Versions & Lineage
- 🔐 Access & Governance
- ⭐ Favorites

## Included UX features

- Grid + table toggle
- Filters + search
- Dataset cards
- Preview modal
- Pull modal
- Favorites
- Workspace integration
- API wiring

## Structure

- `apps/web`: Next.js App Router + shadcn/ui-style React code
- `apps/api`: NestJS + Prisma-style backend code
- `docs`: API notes and wiring summary

## Notes

This is a full copy-paste starter pack designed to be merged into your existing monorepo.
You may need to align imports such as `@/components/ui/*`, auth guards, and your shared Prisma service names to your exact project structure.
