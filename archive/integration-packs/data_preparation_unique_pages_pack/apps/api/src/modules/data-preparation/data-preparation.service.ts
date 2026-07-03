export type PrepStage = 'profiling'|'cleaning'|'harmonization'|'features'|'quality'|'versions';

const stageOrder: PrepStage[] = ['profiling','cleaning','harmonization','features','quality','versions'];

export class DataPreparationService {
  stage(stage: PrepStage, datasetId: string) {
    return {
      datasetId,
      stage,
      order: stageOrder.indexOf(stage) + 1,
      status: 'ready',
      metrics: this.metrics(stage),
      worklist: this.worklist(stage),
      flow: ['database-studio','dataset-registry','profiling','cleaning','harmonization','features','quality','versions','analysis-studio'],
    };
  }

  runStage(stage: PrepStage, datasetId: string) {
    return {
      jobId: `prep-${stage}-${Date.now()}`,
      datasetId,
      stage,
      status: 'completed',
      result: this.metrics(stage),
      nextStage: stageOrder[stageOrder.indexOf(stage)+1] || 'analysis-studio',
      audit: { action: `RUN_${stage.toUpperCase()}`, timestamp: new Date().toISOString() },
    };
  }

  preview(stage: PrepStage, datasetId: string) {
    return { datasetId, stage, preview: this.worklist(stage), changedRows: 2100, changedColumns: stage === 'features' ? 8 : 3 };
  }

  saveVersion(stage: PrepStage, datasetId: string) {
    return { datasetId, stage, version: `v${Math.floor(Math.random()*3)+1}.${Math.floor(Math.random()*9)}`, locked: stage === 'versions', createdAt: new Date().toISOString() };
  }

  handoffFromDatabaseStudio(payload: any) {
    return {
      datasetId: `dataset-${Date.now()}`,
      sourceConnectionId: payload.sourceConnectionId,
      datasetName: payload.datasetName,
      origin: 'database-studio-query',
      sql: payload.sql,
      next: '/dashboard/data-preparation/profiling',
      status: 'registered-for-profiling',
    };
  }

  private metrics(stage: PrepStage) {
    const common = { records: 12842, audit: 'ready' };
    const map: Record<PrepStage, any> = {
      profiling: { ...common, columnsProfiled: 84, missingness: 7.4, duplicates: 312 },
      cleaning: { ...common, missingnessAfter: 1.8, duplicatesAfter: 0, outliersAfter: 0.7 },
      harmonization: { ...common, sourcesAligned: 4, variablesMapped: 126, interoperabilityScore: 91 },
      features: { ...common, featureSets: 12, generatedFeatures: 236, reusableFeatures: 89 },
      quality: { ...common, completeness: 98, consistency: 94, validity: 96, readiness: 'approved' },
      versions: { ...common, currentVersion: 'v1.3', priorVersion: 'v1.2', rowsChanged: 2100 },
    };
    return map[stage];
  }

  private worklist(stage: PrepStage) {
    return [
      { rule: `${stage} check`, target: 'all columns', before: '7.4%', after: '1.8%', status: 'passed' },
      { rule: 'duplicate removal', target: 'patient_id', before: '312', after: '0', status: 'passed' },
      { rule: 'type normalization', target: 'dates/numbers', before: '18 issues', after: '0 issues', status: 'ready' },
    ];
  }
}
