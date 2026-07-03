import { PlatformHeader, MetricCard, ActionCard } from '../../../components/platform/PlatformShell';

export default function GovernancePage() {
  const audits = [
    { event: 'Dataset registered', user: 'Jerry', object: 'ACS_SDOH.csv', stage: 'Data Management' },
    { event: 'Cleaning pipeline executed', user: 'DataNotch', object: 'SDOH v3.2', stage: 'Data Preparation' },
    { event: 'Logistic regression approved', user: 'Reviewer', object: 'Readmission model', stage: 'Analytics & AI' },
  ];
  return (
    <main className="min-h-screen bg-slate-50 p-6 space-y-6">
      <PlatformHeader title="Governance Layer" subtitle="Cross-cutting audit logs, lineage, compliance, data provenance, approvals, RBAC, ownership, and reproducibility across every platform stage." />
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard label="Audit Events" value="1,284" />
        <MetricCard label="Lineage Links" value="946" />
        <MetricCard label="Approvals Pending" value="7" />
        <MetricCard label="Compliance Score" value="98%" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Audit Timeline</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="p-3">Event</th><th>User</th><th>Object</th><th>Stage</th></tr></thead><tbody>{audits.map((a)=><tr className="border-t" key={a.event}><td className="p-3">{a.event}</td><td>{a.user}</td><td>{a.object}</td><td>{a.stage}</td></tr>)}</tbody></table>
        </section>
        <section className="space-y-3">
          <ActionCard title="Approval Queue" description="Approve datasets, analysis jobs, exports, and publications." href="/dashboard/governance?view=approvals" />
          <ActionCard title="Lineage Graph" description="Trace raw data to publication and reproduce result pipelines." href="/dashboard/governance?view=lineage" />
          <ActionCard title="RBAC & Ownership" description="Manage roles, access levels, stewards, and data owners." href="/dashboard/access" />
        </section>
      </div>
    </main>
  );
}
