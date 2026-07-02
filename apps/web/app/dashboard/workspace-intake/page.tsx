import { StagePage } from '@/components/platform/stage-page';

export default function WorkspaceIntakePage() {
  return (
    <StagePage
      active="workspace-intake"
      title="Workspace Intake"
      subtitle="Upload files, import folders, assign project ownership, and register candidate datasets for downstream data management."
      nextLabel="Data Management"
      nextHref="/dashboard/data-management"
      metrics={[
        { label: 'Uploaded Archives', value: 8, note: '3 extracted today' },
        { label: 'Detected Datasets', value: 21, note: 'CSV/XLSX/Parquet' },
        { label: 'Open Intake Tasks', value: 14, note: 'Needs metadata review' },
        { label: 'Ready for Registry', value: 9, note: 'Candidate files' },
      ]}
      worklistTitle="Workspace Intake Worklist"
      worklist={[
        { asset: 'ACS_SDOH.zip', type: 'Archive', status: 'Extracted', next: 'Register 3 datasets' },
        { asset: 'heart_failure.xlsx', type: 'Excel', status: 'Detected', next: 'Preview and classify' },
        { asset: 'codebook.pdf', type: 'Document', status: 'Indexed', next: 'Attach metadata' },
      ]}
      primaryActions={[
        { title: 'Open Workspace Console', description: 'Manage workspaces, teams, and intake handoffs.', href: '/dashboard/workspaces' },
        { title: 'Open Raw File Library', description: 'Upload ZIP/folder payloads and inspect file structures.', href: '/dashboard/files' },
        { title: 'Open Projects & Tasks', description: 'Assign intake tasks and track stage ownership.', href: '/dashboard/projects' },
      ]}
      uniquePanel={
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Intake Handoff Contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
              <p className="mt-1 text-sm text-blue-950">Workspace uploads, folder imports, and metadata attachments.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
              <p className="mt-1 text-sm text-emerald-950">Registered raw dataset candidates with lineage pointers to Data Management.</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
