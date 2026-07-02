import crypto from 'crypto';
import { PreparationDataset } from './data-preparation.types';

export function createDatasetVersion(dataset: PreparationDataset, notes = 'Prepared dataset release') {
  const hash = crypto.createHash('sha256').update(JSON.stringify(dataset.rows)).digest('hex');
  const version = {
    id: `ver_${Date.now()}`,
    datasetId: dataset.id,
    version: 'v1.0.0',
    checksum: hash,
    notes,
    rowCount: dataset.rows.length,
    createdAt: new Date().toISOString(),
    releaseStatus: 'RESEARCH_READY',
  };

  return {
    version,
    lineageEdge: {
      from: dataset.id,
      to: version.id,
      operation: 'dataset_version_release',
      createdAt: version.createdAt,
    },
  };
}
