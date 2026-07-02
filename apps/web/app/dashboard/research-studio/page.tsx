import { StagePage } from '@/components/platform/stage-page';

export default function ResearchStudioPage() {
  return (
    <StagePage
      active="research-studio"
      title="Research Studio"
      subtitle="Turn prepared datasets into research questions, cohorts, variables, protocols, and analytics-ready experiments."
      nextLabel="Analytics & AI"
      nextHref="/dashboard/analytics-ai"
      metrics={[
        { label: 'Questions', value: 18 },
        { label: 'Hypotheses', value: 12 },
        { label: 'Cohorts', value: 7 },
        { label: 'Experiments', value: 9 },
      ]}
      worklistTitle="Research Design Workbench"
      worklist={[
        { item: 'Housing instability → readmission', type: 'Hypothesis', status: 'Ready for logistic regression' },
        { item: 'Food access survival study', type: 'Study Design', status: 'Needs time variable' },
        { item: 'Low-income diabetic cohort', type: 'Cohort', status: '12,842 members' },
      ]}
      primaryActions={[
        { title: 'Open SDOH Research Studio', description: 'Use full research workflow tabs and modules.', href: '/dashboard/sdoh' },
        { title: 'Open Cohort Builder', description: 'Design and test cohort criteria.', href: '/dashboard/sdoh?tab=cohort' },
        { title: 'Open Experiment Setup', description: 'Prepare analytics handoff payloads.', href: '/dashboard/sdoh?tab=analytics' },
      ]}
      uniquePanel={
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Research Handoff Contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
              <p className="mt-1 text-sm text-blue-950">Prepared datasets, variable dictionaries, and stage lineage from Data Preparation.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
              <p className="mt-1 text-sm text-emerald-950">Experiment payloads with cohort definitions and method recommendations for Analytics & AI.</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
