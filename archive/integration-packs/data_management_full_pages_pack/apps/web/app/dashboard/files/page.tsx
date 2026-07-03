'use client';

import React, { useEffect, useState } from 'react';
import { Upload, Archive, FolderTree, Database, FileText, Search, Eye, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { dataManagementApi, RawFileAsset, DataManagementSummary } from '@/src/lib/api/data-management';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export default function RawFileLibraryPage() {
  const [summary, setSummary] = useState<DataManagementSummary | null>(null);
  const [files, setFiles] = useState<RawFileAsset[]>([]);
  const [message, setMessage] = useState('Ready for uploads');

  useEffect(() => {
    dataManagementApi.summary().then(setSummary).catch(() => null);
    dataManagementApi.files().then(setFiles).catch(() => null);
  }, []);

  async function registerDataset(fileId: string) {
    await dataManagementApi.registerFileAsDataset(fileId);
    setMessage('File registered as Raw Dataset and sent to Dataset Registry.');
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'registered' } : f)));
  }

  return (
    <main className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">Workspace Intake</span>
            <h1 className="mt-4 text-4xl font-bold">Raw File Library</h1>
            <p className="mt-2 text-slate-600 max-w-3xl">Upload ZIPs, folders, CSV/XLSX/JSON/Parquet, documents, and research assets. Archives are safely extracted, indexed, classified, and offered as Dataset Registry candidates.</p>
          </div>
          <button className="rounded-xl bg-slate-950 px-5 py-3 text-white flex items-center gap-2"><Upload size={18}/> Upload Files</button>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-8">
          <Card><Archive className="text-violet-600"/><p className="text-sm text-slate-500 mt-3">Files</p><b className="text-3xl">{summary?.files ?? 0}</b></Card>
          <Card><FolderTree className="text-blue-600"/><p className="text-sm text-slate-500 mt-3">Folders</p><b className="text-3xl">{summary?.folders ?? 0}</b></Card>
          <Card><Archive className="text-fuchsia-600"/><p className="text-sm text-slate-500 mt-3">Archives</p><b className="text-3xl">{summary?.archives ?? 0}</b></Card>
          <Card><ShieldCheck className="text-emerald-600"/><p className="text-sm text-slate-500 mt-3">Security Indexed</p><b className="text-3xl">Yes</b></Card>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Workspace File Explorer</h2><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input className="pl-9 rounded-xl border px-3 py-2" placeholder="Search files..."/></div></div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr><th className="p-3 text-left">File</th><th>Type</th><th>Size</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{files.map((f) => <tr key={f.id} className="border-t"><td className="p-3 font-medium">{f.name}<div className="text-xs text-slate-500">{f.path}</div></td><td>{f.kind}</td><td>{f.size}</td><td><span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{f.status}</span></td><td className="space-x-2"><button className="rounded-lg border px-2 py-1"><Eye size={14}/></button>{f.datasetCandidate && <button onClick={() => registerDataset(f.id)} className="rounded-lg bg-violet-600 text-white px-3 py-1">Register Dataset</button>}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Next Handoff</h2>
          <div className="mt-4 space-y-3">
            {['Dataset Registry', 'Data Profiling', 'Create Project', 'Create Task', 'Assign Team'].map((x) => <button key={x} className="w-full rounded-xl border p-3 flex justify-between items-center">{x}<ArrowRight size={16}/></button>)}
          </div>
          <p className="mt-5 rounded-xl bg-blue-50 p-4 text-blue-900">{message}</p>
        </Card>
      </section>
    </main>
  );
}
