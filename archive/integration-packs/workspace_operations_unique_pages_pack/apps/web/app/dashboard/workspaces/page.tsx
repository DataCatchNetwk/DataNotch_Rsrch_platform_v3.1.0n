'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Database, FlaskConical, FolderKanban, Plus, RefreshCw, Users } from 'lucide-react';
import { workspaceOpsApi } from '@/src/lib/api/workspace-ops';

const fallback = [
  {
    id: 'ws-sdoh',
    name: 'SDOH Measures for Census Tract, ACS 2017-2021',
    owner: 'Jerry Godwin',
    status: 'ACTIVE',
    members: 1,
    datasets: 2,
    jobs: 5,
    reports: 5,
    stage: 'DATA_MANAGEMENT',
    description: 'Place-level social determinants of health measures from American Community Survey 5-year data.',
  },
  {
    id: 'ws-readmission',
    name: 'Readmission Risk Equity Study',
    owner: 'Population Health Team',
    status: 'ACTIVE',
    members: 4,
    datasets: 6,
    jobs: 9,
    reports: 3,
    stage: 'ANALYTICS_AI',
    description: 'Workspace for readmission risk, SDOH vulnerability, and model interpretation outputs.',
  },
];

export default function WorkspacesPage() {
  const [items, setItems] = useState(fallback);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(fallback[0]);
  const stats = useMemo(() => ({
    workspaces: items.length,
    members: items.reduce((a, b) => a + b.members, 0),
    datasets: items.reduce((a, b) => a + b.datasets, 0),
    jobs: items.reduce((a, b) => a + b.jobs, 0),
    reports: items.reduce((a, b) => a + b.reports, 0),
  }), [items]);

  useEffect(() => { workspaceOpsApi.workspaces().then(setItems).catch(() => {}); }, []);

  async function createWorkspace() {
    const payload = { name: name || 'New Research Workspace', owner: 'Current User', description: 'New research operations container' };
    try {
      const created = await workspaceOpsApi.createWorkspace(payload);
      setItems([created, ...items]);
      setSelected(created);
    } catch {
      const created = { id: `ws-${Date.now()}`, ...payload, status: 'ACTIVE', members: 1, datasets: 0, jobs: 0, reports: 0, stage: 'DATA_MANAGEMENT' };
      setItems([created as any, ...items]);
    }
    setName('');
  }

  async function handoff(target: any) {
    await workspaceOpsApi.handoffWorkspace(selected.id, target).catch(() => null);
    const path: Record<string, string> = {
      'data-management': '/dashboard/data-sources',
      'data-preparation': '/dashboard/datasets?prep=profiling',
      'research-studio': '/dashboard/research/questions',
      'analytics-ai': '/dashboard/analysis',
      outputs: '/dashboard/results',
      governance: '/dashboard/access',
      system: '/dashboard/settings',
    };
    window.location.href = path[target];
  }

  return <main className="p-8 space-y-6 bg-slate-50 min-h-screen">
    <section className="flex items-center justify-between">
      <div>
        <p className="text-sm tracking-widest text-slate-500 uppercase">Workspace Operations</p>
        <h1 className="text-4xl font-bold">Workspaces</h1>
        <p className="text-slate-600">Create collaborative research containers and hand off work across the full platform lifecycle.</p>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2"><RefreshCw size={16}/> Refresh</button>
        <button onClick={createWorkspace} className="px-4 py-2 rounded-xl bg-violet-600 text-white flex items-center gap-2"><Plus size={16}/> Create Workspace</button>
      </div>
    </section>

    <section className="grid grid-cols-5 gap-4">
      {Object.entries(stats).map(([k,v]) => <div key={k} className="bg-white border rounded-2xl p-5"><p className="capitalize text-slate-500">{k}</p><b className="text-3xl">{v}</b></div>)}
    </section>

    <section className="bg-white border rounded-2xl p-5 flex gap-3">
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name new workspace..." className="border rounded-xl px-4 py-3 flex-1" />
      <button onClick={createWorkspace} className="bg-slate-950 text-white px-5 rounded-xl">Create</button>
    </section>

    <section className="grid grid-cols-[1fr_360px] gap-6">
      <div className="space-y-4">
        {items.map(ws => <button key={ws.id} onClick={()=>setSelected(ws)} className={`w-full text-left bg-white border rounded-2xl p-6 ${selected.id===ws.id?'ring-2 ring-violet-400':''}`}>
          <div className="flex justify-between"><h2 className="text-xl font-semibold">{ws.name}</h2><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">{ws.status}</span></div>
          <p className="text-slate-600 mt-2">{ws.description}</p>
          <div className="flex gap-3 mt-4 text-sm text-slate-500"><span><Users size={14} className="inline"/> {ws.members}</span><span><Database size={14} className="inline"/> {ws.datasets}</span><span><FlaskConical size={14} className="inline"/> {ws.jobs}</span></div>
        </button>)}
      </div>
      <aside className="bg-white border rounded-2xl p-5 space-y-3 h-fit">
        <h3 className="font-semibold">Workspace Handoff</h3>
        {[
          ['data-management','Data Management'], ['data-preparation','Data Preparation'], ['research-studio','Research Studio'], ['analytics-ai','Analytics & AI'], ['outputs','Outputs'], ['governance','Governance'], ['system','System']
        ].map(([id,label]) => <button key={id} onClick={()=>handoff(id)} className="w-full border rounded-xl p-3 flex justify-between hover:bg-slate-50"><span>{label}</span><ArrowRight size={16}/></button>)}
      </aside>
    </section>
  </main>;
}
