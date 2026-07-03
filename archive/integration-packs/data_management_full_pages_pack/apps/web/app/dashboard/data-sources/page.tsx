'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Shield, Activity, Database, Clock, AlertTriangle } from 'lucide-react';
import { dataManagementApi, DataSource } from '@/src/lib/api/data-management';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>; }

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  useEffect(() => { dataManagementApi.sources().then(setSources).catch(() => null); }, []);
  const healthy = sources.filter(s => s.status === 'healthy').length;
  const degraded = sources.filter(s => s.status === 'degraded').length;

  return <main className="p-8 space-y-6 bg-slate-50 min-h-screen">
    <section className="rounded-3xl border bg-white p-8 shadow-sm">
      <div className="flex justify-between"><div><span className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">Administrative Layer</span><h1 className="text-4xl font-bold mt-4">Data Sources</h1><p className="text-slate-600 mt-2 max-w-4xl">Connection administration only: connect, authenticate, monitor health, schedule syncs, track imports, and publish metadata to Database Studio and Dataset Registry.</p></div><button className="rounded-xl bg-slate-950 text-white px-5 py-3 flex gap-2 h-fit"><Plus size={18}/> Add New Source</button></div>
      <div className="grid grid-cols-6 gap-4 mt-8">
        <Card><Database/><p className="text-sm text-slate-500 mt-2">Sources</p><b className="text-2xl">{sources.length}</b></Card>
        <Card><Activity/><p className="text-sm text-slate-500 mt-2">Healthy / Degraded</p><b className="text-2xl">{healthy} / {degraded}</b></Card>
        <Card><Clock/><p className="text-sm text-slate-500 mt-2">Avg Latency</p><b className="text-2xl">92 ms</b></Card>
        <Card><RefreshCw/><p className="text-sm text-slate-500 mt-2">Ingestion Running</p><b className="text-2xl">1</b></Card>
        <Card><AlertTriangle/><p className="text-sm text-slate-500 mt-2">Failed</p><b className="text-2xl">1</b></Card>
        <Card><Shield/><p className="text-sm text-slate-500 mt-2">Governed</p><b className="text-2xl">Yes</b></Card>
      </div>
    </section>
    <section className="grid grid-cols-3 gap-6">
      <Card className="col-span-2"><h2 className="text-xl font-bold mb-4">Source Inventory</h2><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Source</th><th>Type</th><th>Owner</th><th>Records</th><th>Status</th><th>Last Sync</th><th>Action</th></tr></thead><tbody>{sources.map(s => <tr className="border-t" key={s.id}><td className="p-3 font-medium">{s.name}<div className="text-xs text-slate-500">{s.engine}</div></td><td>{s.sourceClass}</td><td>{s.owner}</td><td>{s.records.toLocaleString()}</td><td><span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">{s.status}</span></td><td>{s.lastSync}</td><td><button className="rounded-lg border px-3 py-1">Manage</button></td></tr>)}</tbody></table></Card>
      <Card><h2 className="text-xl font-bold mb-4">Lifecycle Actions</h2>{['Configure','Sync Now','Pause Sync','Refresh Metadata','View Import Logs','View Schema','Data Quality','Lineage','Permissions','Audit History'].map(a => <button key={a} className="w-full rounded-xl border p-3 mb-2 text-left">{a}</button>)}</Card>
    </section>
  </main>;
}
