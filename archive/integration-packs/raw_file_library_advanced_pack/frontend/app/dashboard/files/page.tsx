'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Database, Download, Eye, File, FileSpreadsheet, Folder, GitBranch, Loader2, Plus, Search, ShieldCheck, Upload, WandSparkles } from 'lucide-react';
import { getFileLibrary, uploadWorkspaceFiles, extractArchive, registerFileAsDataset, sendFileToProfiling, RawFileAsset } from '@/src/lib/api/fileLibrary';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function iconFor(asset: RawFileAsset) {
  if (asset.kind === 'folder') return <Folder className="h-5 w-5 text-blue-600" />;
  if (asset.kind === 'archive') return <Archive className="h-5 w-5 text-fuchsia-600" />;
  if (asset.datasetCandidate) return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  return <File className="h-5 w-5 text-slate-600" />;
}

export default function RawFileLibraryPage() {
  const [assets, setAssets] = useState<RawFileAsset[]>([]);
  const [overview, setOverview] = useState({ totalFiles: 0, folders: 0, archives: 0, uploadedToday: 0, datasetCandidates: 0, extractedAssets: 0 });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceId = 'sdoh-diabetes-study';

  async function refresh() {
    setLoading(true);
    const data = await getFileLibrary(workspaceId);
    setOverview(data.overview);
    setAssets(data.assets);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => assets.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.path.toLowerCase().includes(query.toLowerCase())), [assets, query]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    await uploadWorkspaceFiles(workspaceId, Array.from(files));
    await refresh();
    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-950">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">Workspace Intake Layer</span>
            <h1 className="mt-4 text-4xl font-bold">Raw File Library</h1>
            <p className="mt-2 max-w-4xl text-slate-600">Upload, extract, inspect, and register raw research assets before they become governed datasets. ZIP files are safely expanded into the workspace file tree and candidate CSV/XLSX/JSON/Parquet files can be registered into the Dataset Registry.</p>
          </div>
          <button onClick={() => inputRef.current?.click()} className="rounded-xl bg-slate-950 px-5 py-3 text-white flex items-center gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Files
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>

        <div className="mt-8 grid grid-cols-6 gap-4">
          {[
            ['Total files', overview.totalFiles, File], ['Folders', overview.folders, Folder], ['Archives', overview.archives, Archive], ['Uploaded today', overview.uploadedToday, Upload], ['Dataset candidates', overview.datasetCandidates, Database], ['Extracted assets', overview.extractedAssets, GitBranch]
          ].map(([label, value, Icon]: any) => <div key={label} className="rounded-2xl border bg-slate-50 p-5"><Icon className="h-5 w-5 text-violet-600"/><p className="mt-4 text-sm uppercase text-slate-500">{label}</p><p className="text-3xl font-bold">{value}</p></div>)}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-[1fr_360px] gap-6">
        <div className="rounded-3xl bg-white p-6 border shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Workspace File Explorer</h2>
            <div className="relative w-96"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search files, folders, datasets..." className="w-full rounded-xl border px-9 py-2" /></div>
          </div>

          <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); onFiles(e.dataTransfer.files)}} className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 font-medium">Drop ZIP, CSV, XLSX, JSON, Parquet, PDFs, images, or notebooks here</p>
            <p className="text-sm text-slate-500">ZIP archives are scanned, extracted, indexed, and displayed under this workspace.</p>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Asset</th><th>Type</th><th>Size</th><th>Status</th><th>Dataset</th><th className="text-right pr-3">Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td className="p-6" colSpan={6}>Loading...</td></tr> : filtered.map(asset => (
                  <tr key={asset.id} className="border-t">
                    <td className="p-3"><div className="flex items-center gap-3">{iconFor(asset)}<div><p className="font-medium">{asset.name}</p><p className="text-xs text-slate-500">{asset.path}</p></div></div></td>
                    <td>{asset.kind}</td><td>{formatBytes(asset.sizeBytes)}</td><td><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{asset.status}</span></td><td>{asset.datasetCandidate ? 'Candidate' : 'No'}</td>
                    <td className="pr-3 text-right space-x-1">
                      <button title="Preview" className="rounded-lg border p-2"><Eye className="h-4 w-4"/></button>
                      {asset.kind === 'archive' && <button onClick={()=>extractArchive(asset.id).then(refresh)} title="Extract" className="rounded-lg border p-2"><Archive className="h-4 w-4"/></button>}
                      {asset.datasetCandidate && <button onClick={()=>registerFileAsDataset(asset.id).then(refresh)} title="Register Dataset" className="rounded-lg border p-2"><Database className="h-4 w-4"/></button>}
                      {asset.datasetCandidate && <button onClick={()=>sendFileToProfiling(asset.id)} title="Send to Profiling" className="rounded-lg border p-2"><WandSparkles className="h-4 w-4"/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6 border shadow-sm"><h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600"/> Intake Controls</h3><div className="mt-4 space-y-3 text-sm"><p>✓ Malware scan before extraction</p><p>✓ Zip-slip path protection</p><p>✓ Checksums for reproducibility</p><p>✓ Dataset candidate detection</p><p>✓ Audit and lineage events</p></div></div>
          <div className="rounded-3xl bg-white p-6 border shadow-sm"><h3 className="font-semibold">Research Handoff</h3><div className="mt-4 space-y-3"><button className="w-full rounded-xl border p-3 text-left">Register selected as Raw Dataset</button><button className="w-full rounded-xl border p-3 text-left">Create Workspace Task</button><button className="w-full rounded-xl border p-3 text-left">Send to Data Profiling</button><button className="w-full rounded-xl border p-3 text-left">Open Dataset Registry</button></div></div>
        </aside>
      </section>
    </div>
  );
}
