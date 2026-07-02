import { StagePage } from '@/components/platform/stage-page';

export default function OutputsPage() {
  return (
    <StagePage
      active="outputs"
      title="Outputs"
      subtitle="Render analysis assets into dashboards, visualizations, reports, publications, manuscripts, presentations, and governed exports."
      nextLabel="Governance Review"
      nextHref="/dashboard/governance"
      metrics={[
        { label: 'Dashboards', value: 8 },
        { label: 'Visualizations', value: 64 },
        { label: 'Reports', value: 19 },
        { label: 'Exports', value: 37 },
      ]}
      worklistTitle="Output Production Queue"
      worklist={[
        { artifact: 'Table 1', source: 'SDOH cohort', format: 'DOCX/XLSX', status: 'Ready' },
        { artifact: 'Regression Figure', source: 'Logistic model', format: 'PNG/SVG', status: 'Ready' },
        { artifact: 'Policy Brief', source: 'Counterfactual simulation', format: 'PDF', status: 'Draft' },
      ]}
      primaryActions={[
        { title: 'Results Workspace', description: 'Review packaged analysis outputs and handoff state.', href: '/dashboard/results' },
        { title: 'Reports', description: 'Build and review reports/publication materials.', href: '/dashboard/reports' },
        { title: 'Downloads', description: 'Export governed delivery bundles.', href: '/dashboard/downloads' },
      ]}
      uniquePanel={
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Output Router</h2>
          <p className="mt-2 text-slate-600">Each analysis result object maps into charts, interpretation, manuscript sections, exports, and governance review packets.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
              <p className="mt-1 text-sm text-blue-950">Analysis result objects, visual specs, interpretation text, and lineage metadata.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
              <p className="mt-1 text-sm text-emerald-950">Governed output assets across results, reports, presentations, and export packages.</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
