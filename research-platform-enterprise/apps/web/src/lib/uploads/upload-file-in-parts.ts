import {
  completeDatasetUploadPart,
  finalizeDatasetUpload,
  getDatasetUploadPartUrl,
  initiateDatasetUpload,
} from '@/lib/api/datasets';

const PART_SIZE = 5 * 1024 * 1024;

export async function uploadDatasetFileInParts(datasetId: string, file: File, onProgress?: (percent: number) => void) {
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const upload = await initiateDatasetUpload(datasetId, {
    filename: file.name,
    mimeType: file.type,
    totalParts,
    totalSizeBytes: file.size,
  });

  const completedParts: Array<{ partNumber: number; etag: string }> = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const chunk = file.slice(start, end);

    const { url } = await getDatasetUploadPartUrl(datasetId, upload.id, partNumber);
    const response = await fetch(url, {
      method: 'PUT',
      body: chunk,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });

    const etag = response.headers.get('ETag')?.replaceAll('"', '') || '';
    await completeDatasetUploadPart(datasetId, upload.id, { partNumber, etag, sizeBytes: chunk.size });
    completedParts.push({ partNumber, etag });
    onProgress?.(Math.round((partNumber / totalParts) * 100));
  }

  await finalizeDatasetUpload(datasetId, upload.id, completedParts);
}
