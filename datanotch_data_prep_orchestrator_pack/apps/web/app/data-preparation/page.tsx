'use client';
import React, { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Dataset = { id:string; name:string; status:string; qualityScore?:number; rowCount?:number; columnCount?:number; assets:any[]; workflows:any[] };

export default function DataPreparationPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`${API}/api/datasets`);
    setDatasets(await res.json());
  }
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);

  async function upload() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    if (workspaceId) form.append('workspaceId', workspaceId);
    form.append('name', file.name);
    await fetch(`${API}/api/datasets/upload`, { method: 'POST', body: form });
    setFile(null); setLoading(false); load();
  }

  async function runPreparation(id: string) {
    await fetch(`${API}/api/datasets/${id}/run-preparation`, { method: 'POST' });
    load();
  }

  return <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Preparation Orchestrator</h1>
          <p className="text-slate-500">Automatically profile, clean, validate, version, and expose datasets for Workspace and Analytics.</p>
        </div>
        <a href={`${API}/api/health/deep`} className="rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm">Deep Healthcheck</a>
      </header>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Upload / Warehouse Import</h2>
        <p className="mb-4 text-sm text-slate-500">Upload CSV or attach a workspace ID. Upload automatically creates registry, file asset, workspace link, workflow, and queue job.</p>
        <div className="flex flex-wrap gap-3">
          <input className="rounded-2xl border px-4 py-3" placeholder="Workspace ID optional" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} />
          <input className="rounded-2xl border px-4 py-3" type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button disabled={!file || loading} onClick={upload} className="rounded-2xl bg-violet-600 px-5 py-3 font-medium text-white disabled:opacity-50">{loading ? 'Queueing...' : 'Upload & Auto-Clean'}</button>
        </div>
      </section>

      <section className="grid gap-4">
        {datasets.map(ds => <article key={ds.id} className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">{ds.name}</h3>
              <p className="text-xs text-slate-500">{ds.id}</p>
            </div>
            <Status status={ds.status} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
            <Metric label="Rows" value={ds.rowCount ?? '—'} />
            <Metric label="Columns" value={ds.columnCount ?? '—'} />
            <Metric label="Quality" value={ds.qualityScore ? `${ds.qualityScore}%` : '—'} />
            <Metric label="Assets" value={ds.assets?.length ?? 0} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => runPreparation(ds.id)} className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">Run Data Preparation</button>
            <a className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50" href={`${API}/api/datasets/${ds.id}/download?kind=PROFILE_REPORT`}>Download Profile</a>
            <a className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" href={`${API}/api/datasets/${ds.id}/download?kind=CLEANED`}>Download Cleaned CSV</a>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['QUEUED','RAW_REGISTERED','PROFILING','PROFILED','CLEANING','CLEANED','VALIDATING','READY_FOR_ANALYSIS'].map(s =>
              <span key={s} className={`rounded-full px-3 py-1 text-xs ${stageRank(ds.status) >= stageRank(s) ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>{s}</span>
            )}
          </div>
        </article>)}
      </section>
    </div>
  </main>;
}
function Metric({label,value}:{label:string;value:any}) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-slate-500">{label}</div><div className="text-xl font-semibold">{value}</div></div>; }
function Status({status}:{status:string}) { const ready=status==='READY_FOR_ANALYSIS'; const failed=status==='FAILED'; return <span className={`rounded-full px-4 py-2 text-sm font-medium ${ready?'bg-emerald-100 text-emerald-700':failed?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{status}</span>; }
function stageRank(s:string){ return ['QUEUED','RAW_REGISTERED','PROFILING','PROFILED','CLEANING','CLEANED','VALIDATING','READY_FOR_ANALYSIS'].indexOf(s); }
