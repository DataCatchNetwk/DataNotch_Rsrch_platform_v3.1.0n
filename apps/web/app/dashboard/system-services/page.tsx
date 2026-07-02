import { ActionCard, MetricCard, PlatformHeader, StageFlow } from '@/components/platform/platform-shell';

export default function SystemServicesPage() {
  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-6">
      <PlatformHeader
        title="System Services Layer"
        subtitle="Cross-cutting runtime operations for monitoring, scheduling, notifications, security, storage, and worker orchestration."
      />
      <StageFlow active="outputs" />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Running Jobs" value="3" />
        <MetricCard label="Queued Jobs" value="11" />
        <MetricCard label="Workers Online" value="6" />
        <MetricCard label="Uptime" value="99.98%" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard title="Runtime Monitoring" description="Observe API, worker, and infrastructure health." href="/dashboard/monitoring/pipelines" />
        <ActionCard title="Pipeline Monitoring" description="Track ingest, prep, research, analytics, and output runs." href="/dashboard/monitoring/pipelines" />
        <ActionCard title="Job Scheduler" description="Control queued and recurring jobs by stage." href="/dashboard/analysis/jobs" />
        <ActionCard title="Notifications" description="Review operational alerts and workflow events." href="/dashboard/notifications" />
        <ActionCard title="Security Settings" description="Session, auth, and policy controls." href="/dashboard/settings/security" />
        <ActionCard title="Storage & Downloads" description="Manage export objects and storage lifecycle." href="/dashboard/downloads" />
      </div>
    </main>
  );
}
