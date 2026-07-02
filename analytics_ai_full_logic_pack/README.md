# Analysis & AI Full Logic Pack

Adds a production-oriented **Analytics & AI** layer for DataNotch Research Platform.

## Modules included

- Descriptive Statistics
- Inferential Statistics
- Machine Learning
- Artificial Intelligence
- Explainability SHAP/LIME-style fallbacks
- Knowledge Graph
- Causal Analysis
- Survival Analysis
- Time Series Analysis
- Network Analysis
- Geographic Analysis
- Digital Twin
- Counterfactual Simulation

## Flow

```text
Workspace
  -> Data Management
  -> Data Preparation
  -> Research Studio
  -> Analytics & AI
  -> Outputs
```

## Install

Copy files into your repo:

```text
apps/web/app/dashboard/analytics-ai/page.tsx
apps/web/src/lib/api/analysis-ai.ts
apps/api/src/routes/analysis-ai.ts
apps/api/src/modules/analysis-ai/*
apps/api/prisma/analysis-ai.prisma
docs/analysis-ai-flow.md
```

Then wire route in Express:

```ts
import analysisAiRouter from './routes/analysis-ai';
app.use('/api/analysis-ai', analysisAiRouter);
```

Merge Prisma models into `server/prisma/schema.prisma`, then run:

```bash
cd apps/api
npx prisma migrate dev --name analysis_ai_full_logic
```
