'use client';
import { useState } from 'react';
import { researchStudioApi } from '@/src/lib/api/research-studio';
export default function Variables(){const [out,setOut]=useState<any>(null); async function save(){setOut(await researchStudioApi.saveVariables({workspaceId:'active',datasetId:'prepared-sdoh',outcome:'readmission_30d',predictors:['housing_instability','income_level','food_access','insurance_type'],covariates:['age','gender'],cohortN:8421}));}
return <main className="p-8 space-y-6"><Hero title="Variable Selection" desc="Assign outcome, exposures, predictors, covariates, exclusions, and derived variables before analytics."/>
<section className="grid grid-cols-3 gap-5">{['Outcome: readmission_30d','Predictors: 4','Covariates: 2'].map(x=><div className="rounded-2xl bg-white border p-5 font-semibold" key={x}>{x}</div>)}</section><button onClick={save} className="bg-slate-950 text-white px-5 py-3 rounded-xl">Save Variable Set</button>{out&&<pre className="bg-slate-950 text-white p-4 rounded-xl">{JSON.stringify(out,null,2)}</pre>}</main>}
function Hero(p:any){return <section className="rounded-3xl bg-white border p-8"><h1 className="text-4xl font-bold">{p.title}</h1><p className="text-slate-600 mt-2">{p.desc}</p></section>}
