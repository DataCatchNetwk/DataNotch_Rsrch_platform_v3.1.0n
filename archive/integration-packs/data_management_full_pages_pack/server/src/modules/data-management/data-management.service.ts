export type RawFileAsset = {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  size: string;
  path: string;
  status: string;
  datasetCandidate: boolean;
  createdAt: string;
};

export type DataSource = {
  id: string;
  name: string;
  engine: string;
  sourceClass: string;
  owner: string;
  environment: string;
  records: number;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number | null;
  lastSync: string;
};

export type DatasetAsset = {
  id: string;
  name: string;
  stage: 'raw' | 'clean' | 'harmonized' | 'feature_set';
  source: string;
  owner: string;
  records: number;
  variables: number;
  qualityScore: number;
  version: string;
  status: 'draft' | 'active' | 'approved' | 'restricted';
  updatedAt: string;
};

const rawFiles: RawFileAsset[] = [
  { id: 'file-1', workspaceId: 'ws-1', name: 'acs_sdoh_2021.zip', kind: 'zip', size: '18.2 MB', path: '/workspaces/ws-1/uploads/acs_sdoh_2021.zip', status: 'extracted', datasetCandidate: false, createdAt: new Date().toISOString() },
  { id: 'file-2', workspaceId: 'ws-1', name: 'census_tract_sdoh.csv', kind: 'csv', size: '7.8 MB', path: '/workspaces/ws-1/acs_sdoh/census_tract_sdoh.csv', status: 'candidate', datasetCandidate: true, createdAt: new Date().toISOString() },
  { id: 'file-3', workspaceId: 'ws-1', name: 'codebook.pdf', kind: 'pdf', size: '1.1 MB', path: '/workspaces/ws-1/acs_sdoh/codebook.pdf', status: 'indexed', datasetCandidate: false, createdAt: new Date().toISOString() },
];

const sources: DataSource[] = [
  { id: 'src-1', name: 'PostgreSQL', engine: 'PostgreSQL', sourceClass: 'Clinical', owner: 'Jerry', environment: 'Production', records: 1452300, status: 'healthy', latencyMs: 39, lastSync: '5m ago' },
  { id: 'src-2', name: 'Snowflake', engine: 'Snowflake', sourceClass: 'Research', owner: 'Jerry', environment: 'Production', records: 824011, status: 'healthy', latencyMs: 64, lastSync: '14m ago' },
  { id: 'src-3', name: 'BigQuery', engine: 'BigQuery', sourceClass: 'Public', owner: 'Amina', environment: 'Production', records: 230918, status: 'degraded', latencyMs: 170, lastSync: '28m ago' },
  { id: 'src-4', name: 'FHIR Server', engine: 'FHIR', sourceClass: 'Clinical', owner: 'Lina', environment: 'Production', records: 84210, status: 'degraded', latencyMs: 205, lastSync: '1h ago' },
  { id: 'src-5', name: 'OpenNeuro', engine: 'S3/API', sourceClass: 'Research', owner: 'Derek', environment: 'Staging', records: 39040, status: 'offline', latencyMs: null, lastSync: '2h ago' },
];

let datasets: DatasetAsset[] = [
  { id: 'ds-raw-1', name: 'ACS SDOH Census Tract Raw', stage: 'raw', source: 'Workspace ZIP', owner: 'Jerry', records: 128034, variables: 47, qualityScore: 76, version: 'v1.0.0', status: 'active', updatedAt: new Date().toISOString() },
  { id: 'ds-clean-1', name: 'ACS SDOH Cleaned', stage: 'clean', source: 'ACS SDOH Census Tract Raw', owner: 'Jerry', records: 127612, variables: 47, qualityScore: 91, version: 'v1.1.0', status: 'approved', updatedAt: new Date().toISOString() },
  { id: 'ds-harm-1', name: 'Clinical Claims SDOH Harmonized', stage: 'harmonized', source: 'PostgreSQL + Census + Claims', owner: 'Jerry', records: 98042, variables: 118, qualityScore: 94, version: 'v2.0.0', status: 'approved', updatedAt: new Date().toISOString() },
  { id: 'ds-fs-1', name: 'Readmission Risk Feature Set', stage: 'feature_set', source: 'Clinical Claims SDOH Harmonized', owner: 'Jerry', records: 98042, variables: 236, qualityScore: 96, version: 'v2.1.0', status: 'approved', updatedAt: new Date().toISOString() },
];

export class DataManagementService {
  getSummary() {
    return {
      files: rawFiles.length,
      folders: 2,
      archives: rawFiles.filter((f) => f.kind === 'zip').length,
      uploadedToday: rawFiles.length,
      connectedSources: sources.length,
      datasets: datasets.length,
      rawDatasets: datasets.filter((d) => d.stage === 'raw').length,
      cleanDatasets: datasets.filter((d) => d.stage === 'clean').length,
      harmonizedDatasets: datasets.filter((d) => d.stage === 'harmonized').length,
      featureSets: datasets.filter((d) => d.stage === 'feature_set').length,
    };
  }

  getFiles() { return rawFiles; }
  getSources() { return sources; }
  getDatasets(stage?: string) { return stage ? datasets.filter((d) => d.stage === stage) : datasets; }

  registerFileAsDataset(fileId: string) {
    const file = rawFiles.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');
    file.status = 'registered';
    const dataset: DatasetAsset = {
      id: `ds-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      stage: 'raw',
      source: 'Raw File Library',
      owner: 'Jerry',
      records: 1000,
      variables: 12,
      qualityScore: 70,
      version: 'v1.0.0',
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    datasets.unshift(dataset);
    return { file, dataset, next: '/dashboard/datasets?view=raw' };
  }

  sendDatasetToPreparation(datasetId: string) {
    const dataset = datasets.find((d) => d.id === datasetId);
    if (!dataset) throw new Error('Dataset not found');
    const next = dataset.stage === 'raw' ? '/dashboard/datasets?prep=profiling' : dataset.stage === 'clean' ? '/dashboard/datasets?prep=harmonization' : dataset.stage === 'harmonized' ? '/dashboard/datasets?prep=features' : '/dashboard/analysis';
    return { dataset, handoff: 'created', next };
  }

  workspaceHandoff(payload: any) {
    const files = Array.isArray(payload.files) ? payload.files : [];
    const created = files.map((f: any, index: number) => {
      const asset: RawFileAsset = {
        id: `file-${Date.now()}-${index}`,
        workspaceId: payload.workspaceId,
        name: f.name,
        kind: inferKind(f.name),
        size: f.size || 'unknown',
        path: f.path,
        status: isDatasetCandidate(f.name) ? 'candidate' : 'indexed',
        datasetCandidate: isDatasetCandidate(f.name),
        createdAt: new Date().toISOString(),
      };
      rawFiles.unshift(asset);
      return asset;
    });
    return { created, candidates: created.filter((f) => f.datasetCandidate), next: '/dashboard/files' };
  }

  getLineage() {
    return [{ from: 'Workspace ZIP', to: 'Raw Dataset' }, { from: 'Raw Dataset', to: 'Clean Dataset' }, { from: 'Clean Dataset', to: 'Harmonized Dataset' }, { from: 'Harmonized Dataset', to: 'Feature Set' }, { from: 'Feature Set', to: 'Analysis Studio' }];
  }

  getCatalog() {
    return datasets.map((d) => ({ ...d, tags: ['SDOH', 'Population Health'], publications: d.stage === 'feature_set' ? 2 : 0 }));
  }
}

function inferKind(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return 'folder';
  if (['csv','xlsx','json','parquet','pdf','docx','zip'].includes(ext)) return ext;
  if (['png','jpg','jpeg','gif'].includes(ext)) return 'image';
  return 'other';
}

function isDatasetCandidate(name: string): boolean {
  return /\.(csv|xlsx|json|parquet)$/i.test(name);
}
