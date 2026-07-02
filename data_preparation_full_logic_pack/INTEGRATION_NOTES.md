# Integration Notes

## 1. Database Studio → Dataset Registry

When a user clicks "Create Dataset from Query", create a Raw Dataset in Dataset Registry and then expose:

```ts
sendDatasetToPreparation(datasetId, 'profiling')
```

## 2. Dataset Registry → Data Preparation

Add button to Raw Dataset rows:

```tsx
<button onClick={() => sendDatasetToPreparation(dataset.id, 'profiling')}>
  Send to Data Profiling
</button>
```

## 3. Data Preparation → Research Studio

After Dataset Versioning:

```ts
await dataPreparationApi.handoffResearchStudio(datasetId)
```

Then navigate to:

```text
/dashboard/research/questions?datasetId=<preparedVersionId>
```

## 4. Backend route mount

```ts
import dataPreparationRouter from './routes/data-preparation';
app.use('/api/data-preparation', dataPreparationRouter);
```

## 5. Audit and lineage

Each stage should also call your existing audit service:

```ts
audit.log({
  action: 'DATA_PREPARATION_STAGE_RUN',
  entityType: 'dataset',
  entityId: datasetId,
  metadata: { stage }
});
```
