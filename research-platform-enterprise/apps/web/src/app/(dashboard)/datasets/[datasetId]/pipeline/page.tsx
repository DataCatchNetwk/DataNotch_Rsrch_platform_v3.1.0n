'use client';

import { useEffect, useState } from 'react';
import { Database, FileBarChart, FileDown, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getArtifactDownload, getDataset, getDatasetArtifacts } from '@/lib/api/datasets';
import { uploadDatasetFileInParts } from '@/lib/uploads/upload-file-in-parts';

export default function DatasetPipelinePage({ params }: { params: { datasetId: string } }) {
  const [datasetId, setDatasetId] = useState(params.datasetId);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [dataset, setDataset] = useState<any | null>(null);


  useEffect(() => {
    if (!datasetId) return;
    (async () => {
      const [datasetResult, artifactResult] = await Promise.all([
        getDataset(datasetId).catch(() => null),
        getDatasetArtifacts(datasetId).catch(() => []),
      ]);
      setDataset(datasetResult);
      setArtifacts(artifactResult);
    })();
  }, [datasetId]);

  async function refreshArtifacts() {
    if (!datasetId) return;
    const items = await getDatasetArtifacts(datasetId);
    setArtifacts(items);
    const datasetResult = await getDataset(datasetId).catch(() => null);
    setDataset(datasetResult);
  }

  async function handleFileChange(file: File) {
    if (!datasetId) return;
    setUploading(true);
    try {
      await uploadDatasetFileInParts(datasetId, file, setProgress);
      await refreshArtifacts();
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(artifactId: string) {
    const res = await getArtifactDownload(artifactId);
    window.open(res.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dataset Pipeline</h1>
        <p className="text-sm text-slate-500">
          Upload, ingest, profile, and download generated research artifacts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5" />
              Chunk Upload
            </CardTitle>
            <CardDescription>
              Large-file upload with resumable multipart storage flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed text-sm text-slate-500 hover:bg-slate-50">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />
              Select dataset file
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Upload progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading and finalizing dataset...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="font-medium">Dataset snapshot</div>
              <div className="mt-2 space-y-2 text-slate-500">
                <div>Name: {dataset?.name ?? 'Demo dataset'}</div>
                <div>Status: {dataset?.status ?? 'N/A'}</div>
                <div>Rows: {dataset?.rowCount ?? '-'}</div>
                <div>Columns: {dataset?.columnCount ?? '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Artifacts
          </CardTitle>
          <CardDescription>
            Generated previews, profiles, exports, and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {artifacts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              No artifacts yet.
            </div>
          ) : (
            artifacts.map((artifact) => (
              <div key={artifact.id} className="flex items-center justify-between rounded-xl border p-4">
                <div className="min-w-0">
                  <div className="font-medium">{artifact.title}</div>
                  <div className="text-sm text-slate-500">
                    {artifact.kind} • {artifact.mimeType}
                  </div>
                </div>

                <Button variant="outline" onClick={() => handleDownload(artifact.id)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />
    </main>
  );
}
