'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Database, GitBranch, Search, ArrowRight, CheckCircle, Layers, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';
import { dataManagementApi, DatasetAsset } from '@/src/lib/api/data-management';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>; }

const configs: Record<string, { title: string; subtitle: string; stage?: string; action: string; icon: React.ReactNode; unique: string[] }> = {
  registry: { title: 'Dataset Registry', subtitle: 'Master inventory of governed research datasets across raw, clean, harmonized, and feature-set stages.', action: 'Register new dataset', icon: <Database/>, unique: ['Dataset lifecycle board','Stage counters','Approval status','Workspace assignment'] },
  raw: { title: 'Raw Datasets', subtitle: 'Untouched datasets created from workspace uploads, database queries, source imports, APIs, or extracted archives.', stage: 'raw', action: 'Send to Data Profiling', icon: <Database/>, unique: ['Source trace','Raw schema','File checksum','Import audit'] },
  clean: { title: 'Clean Datasets', subtitle: 'Post-cleaning datasets with missingness, duplicates, type issues, and standardization problems resolved.', stage: 'clean', action: 'Send to Harmonization', icon: <CheckCircle/>, unique: ['Cleaning recipe','Before/after metrics','Dedup status','Imputation log'] },
  harmonized: { title: 'Harmonized Datasets', subtitle: 'Cross-source aligned datasets with normalized clinical, SDOH, claims, and outcome variables.', stage: 'harmonized', action: 'Send to Feature Engineering', icon: <Layers/>, unique: ['Ontology map','Source merge score','Variable crosswalk','Canonical dictionary'] },
  features: { title: 'Feature Sets', subtitle: 'Analytics-ready variables, risk scores, ratios, derived fields, and model inputs.', stage: 'feature_set', action: 'Send to Analysis Studio', icon: <Sparkles/>, unique: ['Model target','Feature importance','Reusable features','ML readiness'] },
  lineage: { title: 'Dataset Lineage', subtitle: 'Trace raw-to-clean-to-harmonized-to-feature-set transformations and downstream usage.', action: 'Open Audit Trail', icon: <GitBranch/>, unique: ['Transformation graph','Version ancestry','Pipeline events','Publication usage'] },
  catalog: { title: 'Data Catalog', subtitle: 'Searchable research inventory for datasets, owners, variables, quality scores, tags, and publications.', action: 'Search catalog', icon: <BookOpen/>, unique: ['Variable dictionary','Tags','Quality score','Publication links'] },
};

export default function DatasetRegistryPage() {
  const params = useSearchParams();
  const view = params.get('view') || 'registry';
  const cfg = configs[view] || configs.registry;
  const [datasets, setDatasets] = useState<DatasetAsset[]>([]);
  useEffect(() => { dataManagementApi.datasets(cfg.stage).then(setDatasets).catch(() => null); }, [view]);
  const stats = useMemo(() => ({ records: datasets.reduce((a,b)=>a+b.records,0), variables: datasets.reduce((a,b)=>a+b.variables,0), quality: Math.round(datasets.reduce((a,b)=>a+b.qualityScore,0)/(datasets.length || 1)) }), [datasets]);

  async function sendForward(id: string) { await dataManagementApi.sendDatasetToPreparation(id); }

  return <main className="p-8 bg-slate-50 min-h-screen space-y-6">
    <section className="rounded-3xl border bg-white p-8 shadow-sm"><div className="flex justify-between"><div><span className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">Data Management</span><h1 className="text-4xl font-bold mt-4 flex gap-3">{cfg.icon}{cfg.title}</h1><p className="text-slate-600 mt-2 max-w-4xl">{cfg.subtitle}</p></div><button className="rounded-xl bg-slate-950 text-white px-5 py-3 h-fit">{cfg.action} →</button></div><div className="grid grid-cols-4 gap-4 mt-8"><Card><p className="text-sm text-slate-500">Datasets</p><b className="text-3xl">{datasets.length}</b></Card><Card><p className="text-sm text-slate-500">Records</p><b className="text-3xl">{stats.records.toLocaleString()}</b></Card><Card><p className="text-sm text-slate-500">Variables</p><b className="text-3xl">{stats.variables}</b></Card><Card><p className="text-sm text-slate-500">Quality</p><b className="text-3xl">{stats.quality}%</b></Card></div></section>
    <section className="grid grid-cols-3 gap-6"><Card className="col-span-2"><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{cfg.title} Inventory</h2><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input className="pl-9 rounded-xl border px-3 py-2" placeholder="Search datasets..."/></div></div><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Dataset</th><th>Stage</th><th>Records</th><th>Variables</th><th>Quality</th><th>Version</th><th>Action</th></tr></thead><tbody>{datasets.map(d=><tr key={d.id} className="border-t"><td className="p-3 font-medium">{d.name}<div className="text-xs text-slate-500">{d.source} • {d.owner}</div></td><td>{d.stage}</td><td>{d.records.toLocaleString()}</td><td>{d.variables}</td><td>{d.qualityScore}%</td><td>{d.version}</td><td><button onClick={()=>sendForward(d.id)} className="rounded-lg bg-violet-600 text-white px-3 py-1">Send Forward</button></td></tr>)}</tbody></table></Card><Card><h2 className="text-xl font-bold flex gap-2"><ShieldCheck/> Unique Responsibility</h2><p className="rounded-xl bg-slate-50 p-4 mt-4 text-slate-700">This view owns: {cfg.unique.join(', ')}.</p><h3 className="mt-5 font-bold">Lifecycle Handoff</h3>{['Raw Data','Preparation','Research Design','Analysis','Visualization','Publication'].map(x=><div key={x} className="rounded-xl border p-3 mt-2 flex justify-between">{x}<CheckCircle className="text-emerald-500" size={16}/></div>)}</Card></section>
  </main>;
}
