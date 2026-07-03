'use client';

import React, { useEffect, useState } from 'react';
import { Archive, Database, File, Folder, Upload, Wand2 } from 'lucide-react';
import {
  fetchWorkspaceFiles,
  registerWorkspaceFileDataset,
  sendWorkspaceFileToPreparation,
  uploadWorkspaceZip,
  WorkspaceFileNode,
} from '@/src/lib/api/workspaceZip';

function FileRow({ node, workspaceId, onRefresh, depth = 0 }: {
  node: WorkspaceFileNode;
  workspaceId: string;
  onRefresh: () => void;
  depth?: number;
}) {
  const [busy, setBusy] = useState(false);
  const Icon = node.kind === 'FOLDER' ? Folder : node.extension === '.zip' ? Archive : File;

  async function registerDataset() {
    setBusy(true);
    try {
      await registerWorkspaceFileDataset(workspaceId, node.id);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendToPrep() {
    setBusy(true);
    try {
      await sendWorkspaceFileToPreparation(workspaceId, node.id, 'DATA_PROFILING');
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b px-3 py-2 text-sm" style={{ paddingLeft: 12 + depth * 22 }}>
        <Icon className="h-4 w-4 text-violet-600" />
        <div className="flex-1">
          <div className="font-medium">{node.name}</div>
          <div className="text-xs text-slate-500">{node.relativePath}</div>
        </div>
        {node.isDatasetCandidate && !node.datasetId && (
          <button onClick={registerDataset} disabled={busy} className="rounded-lg border px-3 py-1 hover:bg-slate-50">
            <Database className="mr-1 inline h-3 w-3" /> Register Dataset
          </button>
        )}
        {node.datasetId && (
          <button onClick={sendToPrep} disabled={busy} className="rounded-lg bg-slate-950 px-3 py-1 text-white">
            <Wand2 className="mr-1 inline h-3 w-3" /> Send to Data Profiling
          </button>
        )}
      </div>
      {node.children?.map((child) => (
        <FileRow key={child.id} node={child} workspaceId={workspaceId} onRefresh={onRefresh} depth={depth + 1} />
      ))}
    </>
  );
}

export default function WorkspaceFileExplorer({ workspaceId }: { workspaceId: string }) {
  const [files, setFiles] = useState<WorkspaceFileNode[]>([]);
  const [message, setMessage] = useState('Upload a ZIP file to expand it into this workspace.');

  async function refresh() {
    const tree = await fetchWorkspaceFiles(workspaceId);
    setFiles(tree);
  }

  useEffect(() => { refresh(); }, [workspaceId]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage('Uploading, scanning, and extracting ZIP...');
    const result = await uploadWorkspaceZip(workspaceId, file);
    setMessage(`Extracted ${result.extractedFiles} files. Dataset candidates: ${result.datasetCandidates}.`);
    await refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Workspace File Explorer</h2>
          <p className="text-sm text-slate-600">Uploaded ZIP files are extracted into folders and can be registered as raw datasets.</p>
        </div>
        <label className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-700">
          <Upload className="mr-2 inline h-4 w-4" /> Upload ZIP
          <input type="file" accept=".zip" className="hidden" onChange={onFileChange} />
        </label>
      </div>
      <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
      <div className="overflow-hidden rounded-xl border">
        {files.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No extracted files yet.</div>
        ) : (
          files.map((node) => <FileRow key={node.id} node={node} workspaceId={workspaceId} onRefresh={refresh} />)
        )}
      </div>
    </section>
  );
}
