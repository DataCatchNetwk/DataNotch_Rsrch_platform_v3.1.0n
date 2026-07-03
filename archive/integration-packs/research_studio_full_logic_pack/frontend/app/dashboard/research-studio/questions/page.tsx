'use client';
import { useState } from 'react';
import { researchStudioApi } from '@/src/lib/api/research-studio';
export default function QuestionsPage(){
 const [question,setQuestion]=useState('How does housing instability affect 30-day readmission?');
 const [result,setResult]=useState<any>(null);
 async function save(){ setResult(await researchStudioApi.createQuestion({workspaceId:'active',datasetId:'prepared-sdoh',question,outcome:'readmission_30d',exposure:'housing_instability'})); }
 return <main className="p-8 space-y-6"><Header title="Research Questions" desc="Frame prepared datasets into testable questions with outcome, exposure, population, and rationale." />
 <section className="grid grid-cols-3 gap-5"><Card label="Questions" value="12"/><Card label="Suggested" value="8"/><Card label="Ready for Design" value="4"/></section>
 <section className="rounded-2xl bg-white border p-6"><h2 className="text-xl font-semibold">Question Builder</h2><textarea className="w-full mt-4 border rounded-xl p-4 min-h-32" value={question} onChange={e=>setQuestion(e.target.value)}/><button onClick={save} className="mt-4 bg-slate-950 text-white px-5 py-3 rounded-xl">Save Question</button></section>
 <section className="rounded-2xl bg-white border p-6"><h2 className="font-semibold">Research Reasoning</h2><p className="text-slate-600 mt-2">The system decomposes each question into population, exposure, outcome, covariates, likely bias risks, and recommended study designs.</p>{result&&<pre className="mt-4 bg-slate-950 text-white p-4 rounded-xl overflow-auto">{JSON.stringify(result,null,2)}</pre>}</section></main>}
function Header(p:any){return <section className="rounded-3xl bg-white border p-8"><span className="text-sm bg-violet-50 text-violet-700 rounded-full px-3 py-1">Research Studio</span><h1 className="text-4xl font-bold mt-4">{p.title}</h1><p className="text-slate-600 mt-2">{p.desc}</p></section>}
function Card(p:any){return <div className="rounded-2xl bg-white border p-5"><div className="text-xs uppercase text-slate-500">{p.label}</div><div className="text-3xl font-bold">{p.value}</div></div>}
