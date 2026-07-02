import { StagePage } from '@/components/platform/stage-page';

export default function DataPreparationRootPage() {
  return (
    <StagePage
      active="data-preparation"
      title="Data Preparation"
      subtitle="Apply profiling, cleaning, harmonization, feature engineering, quality checks, and versioning before research design handoff."
      nextLabel="Research Studio"
      nextHref="/dashboard/research-studio"
      metrics={[
        { label: 'Rules Configured', value: 24 },
        { label: 'Eligible Records', value: '12.8k' },
        { label: 'Quality Score', value: '94%' },
        { label: 'Current Version', value: 'v3.2' },
      ]}
      worklistTitle="Preparation Pipeline"
      worklist={[
        { step: 'Profiling', algorithm: 'missingness/outlier/type scan', result: '7.4% missing' },
        { step: 'Cleaning', algorithm: 'imputation + dedupe', result: '312 duplicates removed' },
        { step: 'Harmonization', algorithm: 'ontology + synonym mapping', result: '64 fields mapped' },
        { step: 'Features', algorithm: 'risk scores + interactions', result: '236 features' },
      ]}
      primaryActions={[
        { title: 'Profiling', description: 'Inspect quality and distribution baselines.', href: '/dashboard/data-preparation/profiling' },
        { title: 'Cleaning', description: 'Apply cleaning and normalization policies.', href: '/dashboard/data-preparation/cleaning' },
        { title: 'Versioning', description: 'Lock a validated dataset release.', href: '/dashboard/data-preparation/versioning' },
      ]}
      uniquePanel={
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Preparation Handoff Contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
              <p className="mt-1 text-sm text-blue-950">Registry datasets with stage lineage and source quality metadata.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
              <p className="mt-1 text-sm text-emerald-950">Prepared dataset versions with readiness status for Research Studio.</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
