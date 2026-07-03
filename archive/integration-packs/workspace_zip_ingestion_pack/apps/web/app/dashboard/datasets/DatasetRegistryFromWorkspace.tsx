'use client';

import React, { useEffect, useState } from 'react';
import { fetchWorkspaceRegistryDatasets } from '@/src/lib/api/workspaceZip';

export default function DatasetRegistryFromWorkspace({ workspaceId }: { workspaceId: string }) {
  const [datasets, setDatasets] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkspaceRegistryDatasets(workspaceId).then(setDatasets);
  }, [workspaceId]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Raw Datasets from Workspace Uploads</h2>
      <p className="mb-4 text-sm text-slate-600">Datasets registered from extracted ZIP contents appear here with lineage.</p>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Dataset</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Version</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="border-t">
                <td className="p-3 font-medium">{dataset.name}</td>
                <td className="p-3">{dataset.stage}</td>
                <td className="p-3">{dataset.version}</td>
                <td className="p-3">{dataset.status}</td>
                <td className="p-3">
                  <a className="text-violet-600" href={`/dashboard/datasets?prep=profiling&datasetId=${dataset.id}`}>
                    Open in Data Profiling
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
