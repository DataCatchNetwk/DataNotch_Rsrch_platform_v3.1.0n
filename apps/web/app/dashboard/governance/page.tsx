import { ActionCard, MetricCard, PlatformHeader, StageFlow } from '@/components/platform/platform-shell';

export default function GovernancePage() {
  const audits = [
    { event: 'Dataset registered', user: 'Jerry', object: 'ACS_SDOH.csv', stage: 'Data Management' },
    { event: 'Cleaning pipeline executed', user: 'DataNotch', object: 'SDOH v3.2', stage: 'Data Preparation' },
    { event: 'Logistic regression approved', user: 'Reviewer', object: 'Readmission model', stage: 'Analytics & AI' },
  ];

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-6">
      <PlatformHeader
        title="Governance Layer"
        subtitle="Cross-cutting audit, lineage, compliance, approvals, RBAC, ownership, and reproducibility across the full lifecycle."
      />
      <StageFlow active="outputs" />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Audit Events" value="1,284" />
        <MetricCard label="Lineage Links" value="946" />
        <MetricCard label="Approvals Pending" value="7" />
        <MetricCard label="Compliance Score" value="98%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">Audit Timeline</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-3">Event</th>
                <th>User</th>
                <th>Object</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr className="border-t" key={`${audit.event}-${audit.object}`}>
                  <td className="p-3">{audit.event}</td>
                  <td>{audit.user}</td>
                  <td>{audit.object}</td>
                  <td>{audit.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="space-y-3">
          <ActionCard title="Approval Queue" description="Approve datasets, analysis jobs, exports, and publications." href="/dashboard/access" />
          <ActionCard title="Lineage Explorer" description="Trace raw intake to publication and reproduce pipeline decisions." href="/dashboard/sdoh?tab=data" />
          <ActionCard title="RBAC & Ownership" description="Manage access levels, stewards, and ownership controls." href="/dashboard/access" />
        </section>
      </div>
    </main>
  );
}
