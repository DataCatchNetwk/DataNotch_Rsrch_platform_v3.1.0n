import { StagePage } from '../../../components/platform/StagePage';

export default function OutputsPage() {
  return <StagePage
    active="outputs"
    title="Outputs"
    subtitle="Render analysis results into dashboards, visualizations, reports, publications, manuscripts, executive summaries, presentations, exports, model artifacts, and API outputs."
    nextLabel="Governance Review"
    nextHref="/dashboard/governance"
    metrics={[{label:'Dashboards', value:8}, {label:'Visualizations', value:64}, {label:'Reports', value:19}, {label:'Exports', value:37}]}
    worklistTitle="Output Production Queue"
    worklist={[{artifact:'Table 1', source:'SDOH cohort', format:'DOCX/XLSX', status:'Ready'}, {artifact:'Regression Figure', source:'Logistic model', format:'PNG/SVG', status:'Ready'}, {artifact:'Policy Brief', source:'Counterfactual simulation', format:'PDF', status:'Draft'}]}
    primaryActions={[{title:'Build Dashboard', description:'Interactive dashboard from analysis result objects.', href:'/dashboard/outputs/dashboards'}, {title:'Generate Publication Pack', description:'Tables, figures, methods, results, and appendices.', href:'/dashboard/outputs/publications'}, {title:'Export Evidence Bundle', description:'Download PDF/DOCX/PPTX/XLSX/CSV/JSON artifacts.', href:'/dashboard/downloads'}]}
    uniquePanel={<div className="rounded-3xl border bg-white p-6"><h2 className="text-xl font-bold">Output Router</h2><p className="mt-2 text-slate-600">Each analysis result object automatically maps to charts, interpretation text, manuscript sections, exports, and governance review packets.</p></div>}
  />;
}
