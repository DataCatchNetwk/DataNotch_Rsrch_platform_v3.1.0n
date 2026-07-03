'use client';
import { useState } from 'react';
import { researchStudioApi } from '@/src/lib/api/research-studio';
export default function CohortBuilder(){const [estimate,setEstimate]=useState<any>(null); const rules=[{field:'age',operator:'gte',value:65},{field:'housing_instability',operator:'eq',value:'Yes'}]; async function run(){setEstimate(await researchStudioApi.estimateCohort({totalRows:12842,rules}));}
return <main className="p-8 space-y-6"><Hero title="Cohort Builder" desc="Build eligibility criteria, preview sample size, and save reusable cohorts for analytics."/>
<section className="grid grid-cols-2 gap-5"><div className="rounded-2xl bg-white border p-6"><h2 className="font-semibold">Eligibility Rules</h2>{rules.map((r:any)=><div key={r.field} className="mt-3 rounded-xl border p-3">{r.field} {r.operator} {r.value}</div>)}<button onClick={run} className="mt-4 bg-violet-600 text-white px-5 py-3 rounded-xl">Estimate Cohort</button></div><div className="rounded-2xl bg-white border p-6"><h2 className="font-semibold">Cohort Preview</h2><div className="text-5xl font-bold mt-8">{estimate?.estimatedN || '—'}</div><p className="text-slate-500">eligible records</p></div></section></main>}
function Hero(p:any){return <section className="rounded-3xl bg-white border p-8"><h1 className="text-4xl font-bold">{p.title}</h1><p className="text-slate-600 mt-2">{p.desc}</p></section>}
