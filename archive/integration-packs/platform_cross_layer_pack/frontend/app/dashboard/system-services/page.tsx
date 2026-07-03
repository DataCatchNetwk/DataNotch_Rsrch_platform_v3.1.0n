import { PlatformHeader, MetricCard, ActionCard } from '../../../components/platform/PlatformShell';

export default function SystemServicesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 space-y-6">
      <PlatformHeader title="System Services Layer" subtitle="Cross-cutting runtime monitoring, pipeline monitoring, job scheduler, notifications, authentication, security, administration, storage management, and background workers." />
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard label="Running Jobs" value="3" />
        <MetricCard label="Queued Jobs" value="11" />
        <MetricCard label="Workers Online" value="6" />
        <MetricCard label="Uptime" value="99.98%" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <ActionCard title="Runtime Monitoring" description="Observe CPU, memory, queue latency, database health, and API status." href="/dashboard/monitoring/runtime" />
        <ActionCard title="Pipeline Monitoring" description="Track ingest, preparation, research, analytics, and outputs pipeline runs." href="/dashboard/monitoring/pipelines" />
        <ActionCard title="Job Scheduler" description="Schedule ingestion, profiling, cleaning, model training, and publication jobs." href="/dashboard/system-services?view=scheduler" />
        <ActionCard title="Notifications" description="Alert users when jobs complete, reviews are needed, or data becomes stale." href="/dashboard/notifications" />
        <ActionCard title="Security" description="Authentication, session management, encryption, secrets, and policy enforcement." href="/dashboard/settings/security" />
        <ActionCard title="Storage Management" description="Track file storage, archive extraction, dataset storage, exports, and retention." href="/dashboard/system-services?view=storage" />
      </div>
    </main>
  );
}
