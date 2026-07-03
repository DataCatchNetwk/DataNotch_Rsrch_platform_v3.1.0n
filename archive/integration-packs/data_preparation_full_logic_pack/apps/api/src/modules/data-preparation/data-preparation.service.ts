import { profileDataset } from './profiling.engine';
import { cleanDataset } from './cleaning.engine';
import { harmonizeDataset } from './harmonization.engine';
import { engineerFeatures } from './feature-engineering.engine';
import { validateQuality } from './quality-validation.engine';
import { createDatasetVersion } from './versioning.engine';
import { PreparationDataset, PrepStage } from './data-preparation.types';

const demoRows = [
  { patient_id: 'P-001', age: 72, gender: 'Female', income: 'Low', housing: 'Yes', readmit: true, food_insecurity: 'Yes' },
  { patient_id: 'P-002', age: 68, gender: 'Male', income: 'Medium', housing: 'No', readmit: false, food_insecurity: 'No' },
  { patient_id: 'P-003', age: '', gender: 'Female', income: 'Low', housing: 'Yes', readmit: true, transportation_barrier: 'Yes' },
  { patient_id: 'P-003', age: '', gender: 'Female', income: 'Low', housing: 'Yes', readmit: true, transportation_barrier: 'Yes' },
];

const memoryDatasets = new Map<string, PreparationDataset>([
  ['demo-raw', { id: 'demo-raw', name: 'SDOH Demo Raw Dataset', rows: demoRows, sourceStage: 'raw' }],
]);

const jobs: any[] = [];

function job(stage: PrepStage, datasetId: string, outputs: any, nextStage?: string) {
  const record = {
    id: `prep_${stage}_${Date.now()}`,
    stage,
    datasetId,
    status: 'SUCCEEDED',
    outputs,
    nextStage,
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(record);
  return record;
}

export class DataPreparationService {
  overview() {
    return {
      activeDatasetId: 'demo-raw',
      stages: [
        { key: 'profiling', label: 'Data Profiling', status: 'READY', route: '/dashboard/data-preparation/profiling' },
        { key: 'cleaning', label: 'Cleaning & Wrangling', status: 'WAITING', route: '/dashboard/data-preparation/cleaning' },
        { key: 'harmonization', label: 'Harmonization', status: 'WAITING', route: '/dashboard/data-preparation/harmonization' },
        { key: 'features', label: 'Feature Engineering', status: 'WAITING', route: '/dashboard/data-preparation/features' },
        { key: 'quality', label: 'Quality Validation', status: 'WAITING', route: '/dashboard/data-preparation/quality' },
        { key: 'versioning', label: 'Dataset Versioning', status: 'WAITING', route: '/dashboard/data-preparation/versioning' },
      ],
      metrics: { datasetsInPrep: memoryDatasets.size, completedJobs: jobs.length, researchReady: 1, qualityAvg: 94 },
    };
  }

  stage(stage: PrepStage) {
    return {
      stage,
      jobs: jobs.filter((j) => j.stage === stage),
      dataset: memoryDatasets.get('demo-raw'),
    };
  }

  runProfiling(datasetId = 'demo-raw') {
    const dataset = memoryDatasets.get(datasetId)!;
    const outputs = profileDataset(dataset);
    return job('profiling', datasetId, outputs, 'cleaning');
  }

  runCleaning(datasetId = 'demo-raw') {
    const dataset = memoryDatasets.get(datasetId)!;
    const outputs = cleanDataset(dataset);
    memoryDatasets.set(outputs.dataset.id, outputs.dataset);
    return job('cleaning', datasetId, outputs, 'harmonization');
  }

  runHarmonization(datasetId = 'demo-raw-clean') {
    const dataset = memoryDatasets.get(datasetId) || memoryDatasets.get('demo-raw')!;
    const outputs = harmonizeDataset(dataset);
    memoryDatasets.set(outputs.dataset.id, outputs.dataset);
    return job('harmonization', dataset.id, outputs, 'features');
  }

  runFeatures(datasetId = 'demo-raw-clean-harmonized') {
    const dataset = memoryDatasets.get(datasetId) || memoryDatasets.get('demo-raw')!;
    const outputs = engineerFeatures(dataset);
    memoryDatasets.set(outputs.dataset.id, outputs.dataset);
    return job('features', dataset.id, outputs, 'quality');
  }

  runQuality(datasetId = 'demo-raw-clean-harmonized-features') {
    const dataset = memoryDatasets.get(datasetId) || memoryDatasets.get('demo-raw')!;
    const outputs = validateQuality(dataset);
    return job('quality', dataset.id, outputs, 'versioning');
  }

  createVersion(datasetId = 'demo-raw-clean-harmonized-features', notes?: string) {
    const dataset = memoryDatasets.get(datasetId) || memoryDatasets.get('demo-raw')!;
    const outputs = createDatasetVersion(dataset, notes);
    return job('versioning', dataset.id, outputs, 'research-studio');
  }

  handoffToResearchStudio(datasetId: string) {
    return {
      handoffId: `handoff_${Date.now()}`,
      datasetId,
      target: 'research-studio',
      routes: {
        researchQuestions: '/dashboard/research/questions',
        cohortBuilder: '/dashboard/research/cohorts',
        variableExplorer: '/dashboard/research/variables',
        studyDesign: '/dashboard/research/study-design',
      },
      status: 'READY_FOR_RESEARCH_STUDIO',
    };
  }
}
