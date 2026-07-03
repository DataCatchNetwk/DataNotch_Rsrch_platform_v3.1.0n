'use client';

import React, { useEffect, useState } from 'react';
import { Play, Save, Database, Search, GitBranch, Wand2, Table2, ArrowRight } from 'lucide-react';
import { dataManagementApi, DataSource } from '@/src/lib/api/data-management';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>; }
const rows = [{ patient_id: '8f3c2a91...', age: 72, gender: 'Female', income_level: 'Low', housing_instability: 'Yes', readmission_30d: true }, { patient_id: 'b1a91c21...', age: 68, gender: 'Male', income_level: 'Medium', housing_instability: 'No', readmission_30d: false }];

export default function DatabaseStudioPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [sql, setSql] = useState(`SELECT\n  p.patient_id,\n  p.age,\n  p.gender,\n  p.income_level,\n  s.housing_instability,\n  o.readmission_30d\nFROM sdoh_patients p\nLEFT JOIN sdoh s ON p.patient_id = s.patient_id\nLEFT JOIN outcomes o ON p.patient_id = o.patient_id\nWHERE p.age >= 65\nLIMIT 100;`);
  useEffect(() => { dataManagementApi.sources().then(setSources).catch(() => null); }, []);

  return <main className="p-6 bg-slate-50 min-h-screen">
    <section className="rounded-3xl border bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b flex justify-between"><div><h1 className="text-2xl font-bold flex gap-2"><Database/> Database Studio</h1><p className="text-slate-600">SQL workspace, schema intelligence, query results, and dataset handoff.</p></div><button className="rounded-xl bg-violet-600 text-white px-4 py-2">Sync Metadata</button></div>
      <div className="grid grid-cols-[280px_1fr_320px] h-[720px]">
        <aside className="border-r p-4 overflow-auto"><h2 className="font-bold mb-3">Connections</h2><div className="relative mb-3"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input className="w-full rounded-xl border py-2 pl-9" placeholder="Search..."/></div>{sources.map(s => <div key={s.id} className="rounded-xl border p-3 mb-2"><b>{s.name}</b><p className="text-xs text-slate-500">{s.engine} • {s.records.toLocaleString()} rows</p></div>)}</aside>
        <section className="flex flex-col overflow-hidden"><div className="p-3 border-b flex gap-2"><button className="rounded-lg border px-3 py-2">New Query</button><button className="rounded-lg border px-3 py-2 flex gap-1"><Save size={16}/>Save</button><button className="rounded-lg border px-3 py-2 flex gap-1"><Wand2 size={16}/>AI SQL</button><button className="ml-auto rounded-lg bg-violet-600 text-white px-4 py-2 flex gap-1"><Play size={16}/>Run</button></div><textarea value={sql} onChange={e=>setSql(e.target.value)} className="h-72 p-6 font-mono text-sm border-b outline-none"/><div className="flex-1 overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{Object.keys(rows[0]).map(k=><th key={k} className="p-3 text-left">{k}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t">{Object.values(r).map((v,j)=><td className="p-3" key={j}>{String(v)}</td>)}</tr>)}</tbody></table></div><div className="border-t grid grid-cols-3 gap-3 p-3"><button className="rounded-xl border p-3 flex justify-between">Create Dataset <ArrowRight size={16}/></button><button className="rounded-xl border p-3 flex justify-between">Create Cohort <ArrowRight size={16}/></button><button className="rounded-xl border p-3 flex justify-between">Send to Profiling <ArrowRight size={16}/></button></div></section>
        <aside className="border-l p-4 overflow-auto"><Card><h2 className="font-bold flex gap-2"><Table2/> Schema Explorer</h2>{['AnalysisJob','Dataset','PipelineArtifact','Workspace','WorkspaceMember','RawFileAsset'].map(t=><div className="border-b py-2" key={t}>{t}</div>)}</Card><Card className="mt-4"><h2 className="font-bold flex gap-2"><GitBranch/> Handoff Flow</h2><p className="text-sm text-slate-600 mt-2">Query → Dataset Registry → Raw Dataset → Data Profiling → Cleaning</p></Card></aside>
      </div>
    </section>
  </main>;
}
