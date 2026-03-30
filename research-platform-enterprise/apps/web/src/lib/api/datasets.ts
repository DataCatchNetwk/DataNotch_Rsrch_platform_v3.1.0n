import { api } from './client';

export async function getDataset(datasetId: string) {
  const { data } = await api.get(`/datasets/${datasetId}`);
  return data;
}

export async function initiateDatasetUpload(
  datasetId: string,
  payload: { filename: string; mimeType?: string; totalParts: number; totalSizeBytes?: number },
) {
  const { data } = await api.post(`/datasets/${datasetId}/uploads/initiate`, payload);
  return data;
}

export async function getDatasetUploadPartUrl(datasetId: string, uploadId: string, partNumber: number) {
  const { data } = await api.post(`/datasets/${datasetId}/uploads/${uploadId}/parts/url`, { partNumber });
  return data;
}

export async function completeDatasetUploadPart(
  datasetId: string,
  uploadId: string,
  payload: { partNumber: number; etag: string; sizeBytes?: number; checksumSha256?: string },
) {
  const { data } = await api.post(`/datasets/${datasetId}/uploads/${uploadId}/parts/complete`, payload);
  return data;
}

export async function finalizeDatasetUpload(datasetId: string, uploadId: string, parts: Array<{ partNumber: number; etag: string }>) {
  const { data } = await api.post(`/datasets/${datasetId}/uploads/${uploadId}/complete`, { parts });
  return data;
}

export async function getDatasetArtifacts(datasetId: string) {
  const { data } = await api.get(`/datasets/${datasetId}/artifacts`);
  return data;
}

export async function getArtifactDownload(artifactId: string) {
  const { data } = await api.get(`/artifacts/${artifactId}/download`);
  return data;
}
