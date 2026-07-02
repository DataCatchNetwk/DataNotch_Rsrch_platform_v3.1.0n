export type DatasetStage = 'raw' | 'clean' | 'harmonized' | 'features';

const datasets = [
  { id: 'raw-001', name: 'FHIR Patient Import', stage: 'raw', source: 'FHIR Server', owner: 'Lina', records: 84210, variables: 62, qualityScore: 78, status: 'Imported', version: 'v1.0', lastUpdated: 'Today 08:10', tags: ['Clinical', 'FHIR', 'Raw'] },
  { id: 'raw-002', name: 'Claims Extract 2026', stage: 'raw', source: 'SQL Server', owner: 'Nadia', records: 550900, variables: 87, qualityScore: 73, status: 'Needs Review', version: 'v1.0', lastUpdated: 'Today 09:01', tags: ['Claims', 'Raw'] },
  { id: 'clean-001', name: 'Clean SDOH Patients', stage: 'clean', source: 'PostgreSQL', owner: 'Jerry', records: 1452300, variables: 108, qualityScore: 94, status: 'Clean', version: 'v1.3', lastUpdated: 'Today 09:39', tags: ['SDOH', 'Clean'] },
  { id: 'harm-001', name: 'Harmonized SDOH Clinical Outcome', stage: 'harmonized', source: 'PostgreSQL + FHIR + Census', owner: 'Jerry', records: 1248300, variables: 142, qualityScore: 96, status: 'Approved', version: 'v2.0', lastUpdated: 'Today 10:10', tags: ['Clinical', 'SDOH', 'Outcome'] },
  { id: 'feat-001', name: 'Readmission Risk Feature Set', stage: 'features', source: 'Harmonized SDOH Clinical Outcome', owner: 'Jerry', records: 1248300, variables: 62, qualityScore: 97, status: 'Ready', version: 'v3.0', lastUpdated: 'Today 12:14', tags: ['Risk', 'Readmission', 'ML Ready'] },
];

export const datasetRegistryService = {
  summary() {
    return {
      total: datasets.length,
      raw: datasets.filter((d) => d.stage === 'raw').length,
      clean: datasets.filter((d) => d.stage === 'clean').length,
      harmonized: datasets.filter((d) => d.stage === 'harmonized').length,
      featureSets: datasets.filter((d) => d.stage === 'features').length,
      researchReady: datasets.filter((d) => d.status === 'Ready' || d.status === 'Approved').length,
    };
  },

  byStage(stage: DatasetStage) {
    return datasets.filter((d) => d.stage === stage);
  },

  catalog() {
    return datasets;
  },

  lineage() {
    return {
      nodes: [
        { id: 'source', label: 'Data Sources', type: 'source', status: 'ready' },
        { id: 'raw', label: 'Raw Dataset', type: 'dataset', status: 'ready' },
        { id: 'clean', label: 'Clean Dataset', type: 'dataset', status: 'ready' },
        { id: 'harmonized', label: 'Harmonized Dataset', type: 'dataset', status: 'ready' },
        { id: 'features', label: 'Feature Set', type: 'feature', status: 'ready' },
        { id: 'study', label: 'Research Study', type: 'study', status: 'ready' },
        { id: 'analysis', label: 'Analysis Job', type: 'analysis', status: 'ready' },
        { id: 'publication', label: 'Publication', type: 'publication', status: 'draft' },
      ],
      edges: [
        { from: 'source', to: 'raw', label: 'import' },
        { from: 'raw', to: 'clean', label: 'cleaning' },
        { from: 'clean', to: 'harmonized', label: 'harmonization' },
        { from: 'harmonized', to: 'features', label: 'feature engineering' },
        { from: 'features', to: 'study', label: 'study assignment' },
        { from: 'study', to: 'analysis', label: 'analysis execution' },
        { from: 'analysis', to: 'publication', label: 'publication output' },
      ],
    };
  },

  handoff(id: string, target: string) {
    return { id, target, status: 'queued', message: `Dataset ${id} sent to ${target}` };
  },

  profile(id: string) {
    return { id, status: 'profiled', missingness: 1.4, duplicates: 0.2, qualityScore: 94 };
  },

  requestAccess(id: string) {
    return { id, status: 'access_requested', reviewerQueue: true };
  },
};
