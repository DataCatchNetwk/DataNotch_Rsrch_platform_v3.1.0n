"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Database, File, Folder, RefreshCcw, Upload, Wand2 } from "lucide-react";
import {
  fetchWorkspaceFiles,
  registerWorkspaceFileDataset,
  sendWorkspaceFileToPreparation,
  uploadWorkspaceZip,
  type WorkspaceFileNode,
} from "@/src/lib/api/workspaceZip";
import { Button } from "@/components/ui/button";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size.toFixed(size < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

function FileRow(props: {
  node: WorkspaceFileNode;
  workspaceId: string;
  onRefresh: () => Promise<void>;
  depth?: number;
}) {
  const { node, workspaceId, onRefresh, depth = 0 } = props;
  const [busy, setBusy] = useState(false);
  const iconClass = "h-4 w-4 text-indigo-600";
  const indentClass =
    depth <= 0
      ? "pl-3"
      : depth === 1
        ? "pl-8"
        : depth === 2
          ? "pl-13"
          : depth === 3
            ? "pl-18"
            : "pl-23";

  const Icon = node.kind === "FOLDER" ? Folder : node.extension === ".zip" ? Archive : File;

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
      await sendWorkspaceFileToPreparation(workspaceId, node.id, "profiling");
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm ${indentClass}`}>
        <Icon className={iconClass} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-slate-900">{node.name}</div>
          <div className="truncate text-xs text-slate-500">{node.relativePath}</div>
        </div>
        <div className="hidden text-xs text-slate-500 md:block">{formatBytes(node.sizeBytes)}</div>

        {node.isDatasetCandidate && !node.datasetId ? (
          <Button
            variant="outline"
            onClick={() => void registerDataset()}
            disabled={busy}
            className="h-8 rounded-lg border-slate-200"
          >
            <Database className="mr-1 h-3.5 w-3.5" />
            Register
          </Button>
        ) : null}

        {node.datasetId ? (
          <Button
            onClick={() => void sendToPrep()}
            disabled={busy}
            className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            <Wand2 className="mr-1 h-3.5 w-3.5" />
            To Profiling
          </Button>
        ) : null}
      </div>

      {node.children.map((child) => (
        <FileRow key={child.id} node={child} workspaceId={workspaceId} onRefresh={onRefresh} depth={depth + 1} />
      ))}
    </>
  );
}

export default function WorkspaceFileExplorer({ workspaceId }: { workspaceId: string }) {
  const [files, setFiles] = useState<WorkspaceFileNode[]>([]);
  const [message, setMessage] = useState("Upload a ZIP file to expand it into this workspace.");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const tree = await fetchWorkspaceFiles(workspaceId);
    setFiles(tree);
  }

  useEffect(() => {
    void refresh();
  }, [workspaceId]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setMessage("Uploading, scanning, and extracting ZIP...");
      const result = await uploadWorkspaceZip(workspaceId, file);
      setMessage(`Extracted ${result.extractedFiles} files. Dataset candidates: ${result.datasetCandidates}.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ZIP upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workspace File Explorer</h2>
          <p className="text-sm text-slate-600">
            Upload ZIP archives, extract workspace files, and register raw datasets for profiling.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => void refresh()} disabled={busy}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <label className="inline-flex cursor-pointer items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload ZIP
            <input type="file" accept=".zip" className="hidden" onChange={(event) => void onFileChange(event)} />
          </label>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        {files.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No extracted files yet.</div>
        ) : (
          files.map((node) => <FileRow key={node.id} node={node} workspaceId={workspaceId} onRefresh={refresh} />)
        )}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Registered files appear in the dataset list and can be opened in
        <Link href="/dashboard/datasets?prep=profiling" className="ml-1 text-indigo-700 hover:text-indigo-600">
          Data Profiling
        </Link>
        .
      </div>
    </section>
  );
}
