'use client';
import { useState } from 'react';
import { researchStudioApi } from '@/src/lib/api/research-studio';
export default function StudyDesignPage(){ const [rec,setRec]=useState<any>(null); async function recommend(){setRec(await researchStudioApi.recommendStudyDesign({outcome:'readmission_30d',exposure:'housing_instability'}));}
 return <main className="p-8 space-y-6"><Hero title="Study Design" desc="Choose the correct design before running models: cohort, cross-sectional, longitudinal, case-control, quasi-experimental, or mixed-methods."/>
 <section className="grid grid-cols-4 gap-4">{['Retrospective Cohort','Cross-sectional','Longitudinal','Case-Control'].map(x=><div className="rounded-2xl bg-white border p-5" key={x}><h3 className="font-semibold">{x}</h3><p className="text-sm text-slate-500 mt-2">Recommended based on outcome, time structure, exposure, and dataset quality.</p></div>)}</section>
 <section className="rounded-2xl bg-white border p-6"><button onClick={recommend} className="bg-slate-950 text-white rounded-xl px-5 py-3">Recommend Design</button>{rec&&<pre className="mt-4 bg-slate-950 text-white p-4 rounded-xl">{JSON.stringify(rec,null,2)}</pre>}</section></main>}
function Hero(p:any){return <section className="rounded-3xl bg-white border p-8"><h1 className="text-4xl font-bold">{p.title}</h1><p className="text-slate-600 mt-2">{p.desc}</p></section>}
