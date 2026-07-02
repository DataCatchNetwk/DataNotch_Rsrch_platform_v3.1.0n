# Integration

## API

In `apps/api/src/app.ts`:

```ts
import { outputsRouter } from './routes/outputs';
import { analyticsToOutputsRouter } from './routes/analytics-to-outputs';

app.use('/api/outputs', outputsRouter);
app.use('/api', analyticsToOutputsRouter);
```

## Frontend

Add menu items under OUTPUTS:

```tsx
/dashboard/outputs?view=dashboards
/dashboard/outputs?view=visualizations
/dashboard/outputs?view=reports
/dashboard/outputs?view=publications
/dashboard/outputs?view=manuscripts
/dashboard/outputs?view=executive
/dashboard/outputs?view=presentations
/dashboard/outputs?view=data-exports
/dashboard/outputs?view=model-exports
/dashboard/outputs?view=api
```

## Analytics Handoff

From Analysis & AI results page:

```ts
await handoffAnalysisToOutputs(job.id, {
  workspaceId,
  outputType: 'publication',
  title: 'SDOH Readmission Publication Pack'
});
```
