'use client';

import { useSearchParams } from 'next/navigation';
import { OutputShell, PageHero, StatCard } from '@/components/outputs/OutputShell';
import { generateAllOutputs } from '@/lib/api/outputs';
import { useState } from 'react';

const workspaceId = 'demo-workspace';

function Dashboards() {
  return (
    <>
      <PageHero
        tag="Outputs"
        title="Interactive Dashboards"
        description="Render live research command centers from analysis results, cohorts, models, visualizations, and publication assets."
        action={<button className="bg-black text-white px-5 py-3 rounded-xl">Open live dashboard →</button>}
      />
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Dashboards" value="12" sub="active" />
        <StatCard label="Live widgets" value="48" sub="connected" />
        <StatCard label="Refresh" value="15m" sub="scheduled" />
        <StatCard label="Shared" value="7" sub="teams" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        {['Research Command Center','SDOH Risk Dashboard','Publication Evidence Board'].map(x => (
          <div key={x} className="rounded-2xl bg-white border p-5">
            <h3 className="font-semibold">{x}</h3>
            <p className="text-sm text-slate-600 mt-2">KPIs, charts, recent outputs, and drill-down evidence.</p>
            <button className="mt-4 px-4 py-2 rounded-lg border">Open</button>
          </div>
        ))}
      </div>
    </>
  );
}

function Visualizations() {
  return (
    <>
      <PageHero tag="Outputs" title="Visualization Studio" description="Turn result objects into manuscript-ready figures and interactive chart dashboards." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Generate figure →</button>} />
      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border p-6">
          <h3 className="font-semibold">Recommended Figures</h3>
          {['SHAP feature importance','Regression forest plot','Kaplan-Meier survival curve','County choropleth map','Cohort flow diagram'].map(v => (
            <div className="mt-3 flex justify-between rounded-xl border p-3"><span>{v}</span><button className="text-violet-700">Create</button></div>
          ))}
        </div>
        <div className="rounded-2xl bg-white border p-6">
          <h3 className="font-semibold">Figure Preview</h3>
          <div className="mt-4 space-y-4">
            {['Housing instability 92%','Income level 78%','Food access 68%','Insurance type 54%'].map((x,i)=>(
              <div key={x}><div className="flex justify-between text-sm"><span>{x.split(' ')[0]} {x.split(' ')[1]||''}</span><span>{x.match(/\d+%/)?.[0]}</span></div><div className="h-3 bg-slate-100 rounded"><div className="h-3 bg-violet-600 rounded" style={{width: x.match(/\d+/)?.[0]+'%'}} /></div></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Reports() {
  return (
    <>
      <PageHero tag="Outputs" title="Reports" description="Generate structured research, technical, and appendix-ready reports from approved analyses." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Build report →</button>} />
      <div className="grid grid-cols-3 gap-5">
        {['Research Report','Technical Appendix','Audit Evidence Report'].map(t => <div className="rounded-2xl bg-white border p-5"><h3 className="font-semibold">{t}</h3><p className="text-sm text-slate-600 mt-2">Includes tables, charts, methods, results, and lineage.</p></div>)}
      </div>
    </>
  );
}

function Publications() {
  return (
    <>
      <PageHero tag="Outputs" title="Publications" description="Create journal-ready tables, figures, captions, and evidence packs." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Create publication pack →</button>} />
      <div className="grid grid-cols-4 gap-4"><StatCard label="Table 1" value="Ready" /><StatCard label="Regression" value="Ready" /><StatCard label="Figures" value="5" /><StatCard label="Reviewer status" value="Pending" /></div>
    </>
  );
}

function Manuscripts() {
  return (
    <>
      <PageHero tag="Outputs" title="Manuscripts" description="Draft manuscript sections using traceable results, methods, limitations, and publication tables." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Draft manuscript →</button>} />
      <div className="rounded-2xl bg-white border p-6 grid grid-cols-2 gap-4">
        {['Abstract','Methods','Results','Discussion','Limitations','Conclusion'].map(s => <div className="rounded-xl border p-4">{s}</div>)}
      </div>
    </>
  );
}

function Executive() {
  return (
    <>
      <PageHero tag="Outputs" title="Executive Summaries" description="Translate statistical evidence into decision-ready summaries for leadership, policy, and stakeholder review." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Generate summary →</button>} />
      <div className="rounded-2xl bg-white border p-6"><h3 className="font-semibold">Key Finding</h3><p className="mt-2 text-slate-700">Housing instability is the leading actionable SDOH predictor of readmission risk.</p></div>
    </>
  );
}

function Presentations() {
  return (
    <>
      <PageHero tag="Outputs" title="Presentation Builder" description="Create PowerPoint-style decks, conference briefs, and research presentation outlines." action={<button className="bg-black text-white px-5 py-3 rounded-xl">Build deck →</button>} />
      <div className="grid grid-cols-4 gap-4">{['Title','Question','Dataset','Methods','Results','Figures','Recommendations','Next Steps'].map(s => <div className="rounded-xl bg-white border p-4 text-center">{s}</div>)}</div>
    </>
  );
}

function Exports({ type }: { type: 'data' | 'model' | 'api' }) {
  const title = type === 'data' ? 'Data Exports' : type === 'model' ? 'Model Exports' : 'API Outputs';
  const desc = type === 'data'
    ? 'Export datasets, cohorts, and result tables as CSV, XLSX, JSON, or Parquet.'
    : type === 'model'
    ? 'Package models, metrics, feature schemas, SHAP assets, and model cards.'
    : 'Publish governed output endpoints for dashboards, results, reports, and downstream apps.';
  return (
    <>
      <PageHero tag="Outputs" title={title} description={desc} action={<button className="bg-black text-white px-5 py-3 rounded-xl">Create export →</button>} />
      <div className="grid grid-cols-4 gap-4">
        {(type === 'data' ? ['CSV','XLSX','JSON','Parquet'] : type === 'model' ? ['ONNX','PKL','Model Card','Metrics JSON'] : ['REST','Webhook','Signed URL','Schema']).map(f => <div className="rounded-2xl bg-white border p-5 font-semibold">{f}</div>)}
      </div>
    </>
  );
}

export default function OutputsPage() {
  const view = useSearchParams().get('view') || 'dashboards';
  const [msg, setMsg] = useState('');

  async function generate() {
    await generateAllOutputs(workspaceId, 'analysis-demo');
    setMsg('All output assets generated from the selected analysis result.');
  }

  const content =
    view === 'visualizations' ? <Visualizations /> :
    view === 'reports' ? <Reports /> :
    view === 'publications' ? <Publications /> :
    view === 'manuscripts' ? <Manuscripts /> :
    view === 'executive' ? <Executive /> :
    view === 'presentations' ? <Presentations /> :
    view === 'data-exports' ? <Exports type="data" /> :
    view === 'model-exports' ? <Exports type="model" /> :
    view === 'api' ? <Exports type="api" /> :
    <Dashboards />;

  return (
    <main className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">Research Platform</p>
          <h2 className="text-xl font-semibold">Outputs</h2>
        </div>
        <button onClick={generate} className="bg-violet-600 text-white px-5 py-3 rounded-xl">Generate all outputs</button>
      </div>
      {msg ? <div className="rounded-xl border bg-emerald-50 text-emerald-700 p-4">{msg}</div> : null}
      <OutputShell active={view}>{content}</OutputShell>
    </main>
  );
}
