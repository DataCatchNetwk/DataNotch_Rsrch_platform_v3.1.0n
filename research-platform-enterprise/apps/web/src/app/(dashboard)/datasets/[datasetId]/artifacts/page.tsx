'use client';

import { useEffect, useState } from 'react';
import { FileDown, FileJson2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getArtifactDownload, getDatasetArtifacts } from '@/lib/api/datasets';

export default function DatasetArtifactsPage({ params }: { params: { datasetId: string } }) {
  const [artifacts, setArtifacts] = useState<any[]>([]);

  useEffect(() => {
    getDatasetArtifacts(params.datasetId).then(setArtifacts).catch(() => setArtifacts([]));
  }, [params.datasetId]);

  async function handleDownload(artifactId: string) {
    const res = await getArtifactDownload(artifactId);
    window.open(res.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dataset Artifacts</h1>
        <p className="text-sm text-slate-500">Every generated output for this dataset in one place.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson2 className="h-5 w-5" />
            Available Artifacts
          </CardTitle>
          <CardDescription>Preview JSON, profile JSON, exports, reports, and future chart bundles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <div className="font-medium">{artifact.title}</div>
                <div className="text-sm text-slate-500">{artifact.kind} • {artifact.mimeType}</div>
              </div>
              <Button variant="outline" onClick={() => handleDownload(artifact.id)}>
                <FileDown className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
