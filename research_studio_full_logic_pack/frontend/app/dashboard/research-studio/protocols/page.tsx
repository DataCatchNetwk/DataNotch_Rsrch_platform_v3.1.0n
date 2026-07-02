'use client';
import { useState } from 'react';
import { researchStudioApi } from '@/src/lib/api/research-studio';
export default function Protocols(){const [p,setP]=useState<any>(); async function gen(){setP(await researchStudioApi.generateProtocol({designType:'retrospective cohort',exposure:'housing instability',outcome:'readmission_30d',predictors:['income','insurance'],cohortN:8421}));}
return <main className="p-8 space-y-6"><Hero title="Protocol Builder" desc="Generate methods, eligibility criteria, ethics notes, and analysis plan for reproducible research."/><button className="bg-violet-600 text-white px-5 py-3 rounded-xl" onClick={gen}>Generate Protocol</button>{p&&<section className="rounded-2xl bg-white border p-6"><h2 className="font-semibold">Draft Protocol</h2><pre className="mt-4 whitespace-pre-wrap">{JSON.stringify(p,null,2)}</pre></section>}</main>}
function Hero(p:any){return <section className="rounded-3xl bg-white border p-8"><h1 className="text-4xl font-bold">{p.title}</h1><p className="text-slate-600 mt-2">{p.desc}</p></section>}
