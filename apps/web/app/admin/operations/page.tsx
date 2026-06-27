'use client';

import * as React from 'react';
import { Activity, Database, RefreshCw, RotateCcw, ServerCog, ShieldCheck, SquareX, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cancelWorkerJob, getOpsHealth, getOpsSummary, getWorkerJobs, retryWorkerJob, type OpsHealth, type OpsSummary, type WorkerJobItem } from '@/lib/api/ops';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return <Badge className={ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{label}</Badge>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function OperationsContent() {
  const [health, setHealth] = React.useState<OpsHealth | null>(null);
  const [summary, setSummary] = React.useState<OpsSummary | null>(null);
  const [jobs, setJobs] = React.useState<WorkerJobItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextHealth, nextSummary, nextJobs] = await Promise.all([
        getOpsHealth(),
        getOpsSummary(),
        getWorkerJobs(statusFilter || undefined),
      ]);
      setHealth(nextHealth);
      setSummary(nextSummary);
      setJobs(nextJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations center.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function retry(jobId: string) {
    try {
      await retryWorkerJob(jobId);
      toast.success('Worker job queued for retry');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Retry failed');
    }
  }

  async function cancel(jobId: string) {
    try {
      await cancelWorkerJob(jobId);
      toast.success('Worker job canceled');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    }
  }

  return (
    <AdminShell title="Operations Center" description="Production readiness, runtime health, queue control, and deployment safety checks.">
      {loading ? <AdminLoading cards={3} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && health && summary ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge ok={health.status === 'ready'} label={health.status.toUpperCase()} />
              <Badge variant="outline">Request {health.requestId ?? 'n/a'}</Badge>
              <Badge variant="outline">{summary.system.environment}</Badge>
            </div>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Database" value={<span className="inline-flex items-center gap-2"><Database className="h-5 w-5" />{health.checks.database.ok ? `${health.checks.database.latencyMs} ms` : 'Down'}</span>} />
            <Metric label="Queue Mode" value={<span className="inline-flex items-center gap-2"><ServerCog className="h-5 w-5" />{health.checks.queue.mode}</span>} />
            <Metric label="Realtime Rooms" value={<span className="inline-flex items-center gap-2"><Wifi className="h-5 w-5" />{summary.totals.communicationRooms}</span>} />
            <Metric label="Pipeline Runs" value={<span className="inline-flex items-center gap-2"><Activity className="h-5 w-5" />{summary.totals.pipelineRuns}</span>} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <AdminCard title="Worker Queue" description="PostgreSQL local mode and Redis/BullMQ mode report into the same worker ledger.">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Queued" value={summary.workers.queued} />
                <Metric label="Active" value={summary.workers.active} />
                <Metric label="Failed" value={summary.workers.failed} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['', 'QUEUED', 'ACTIVE', 'FAILED', 'COMPLETED', 'CANCELED'].map((status) => (
                  <Button key={status || 'all'} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>
                    {status || 'ALL'}
                  </Button>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="Deployment Guardrails" description="Readiness signals that should be green before public rollout.">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border p-3"><span>Database reachable</span><StatusBadge ok={health.checks.database.ok} label={health.checks.database.ok ? 'OK' : 'CHECK'} /></div>
                <div className="flex items-center justify-between rounded-xl border p-3"><span>Queue backend</span><Badge variant="outline">{summary.system.queueBackend}</Badge></div>
                <div className="flex items-center justify-between rounded-xl border p-3"><span>Network protection</span><StatusBadge ok={summary.system.authNetworkBlockEnabled} label={summary.system.authNetworkBlockEnabled ? 'ON' : 'OFF'} /></div>
                <div className="flex items-center justify-between rounded-xl border p-3"><span>Fail-closed auth checks</span><StatusBadge ok={summary.system.authNetworkFailClosed} label={summary.system.authNetworkFailClosed ? 'ON' : 'DEV'} /></div>
              </div>
            </AdminCard>
          </div>

          <AdminCard title="Worker Jobs" description="Retry failed work, cancel stuck queued work, and verify pipeline progress.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Job</th>
                    <th>Status</th>
                    <th>Queue</th>
                    <th>Progress</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-3"><div className="font-medium text-slate-900">{job.jobName}</div><div className="text-xs text-slate-500">{job.id}</div></td>
                      <td><Badge variant="outline">{job.status}</Badge></td>
                      <td>{job.queueName}</td>
                      <td>{Math.round(job.progressPercent)}%</td>
                      <td>{new Date(job.updatedAt).toLocaleString()}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={!['FAILED', 'CANCELED'].includes(job.status)} onClick={() => void retry(job.id)}><RotateCcw className="mr-1 h-3 w-3" />Retry</Button>
                          <Button size="sm" variant="outline" disabled={!['QUEUED', 'ACTIVE', 'RETRYING'].includes(job.status)} onClick={() => void cancel(job.id)}><SquareX className="mr-1 h-3 w-3" />Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!jobs.length ? <tr><td className="py-8 text-center text-slate-500" colSpan={6}>No worker jobs match this filter.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <AdminCard title="Recommendations" description="Live operational guidance based on current runtime state.">
            <div className="grid gap-3 md:grid-cols-3">
              {summary.recommendations.map((item) => (
                <div key={item} className="rounded-xl border bg-white p-4 text-sm text-slate-700">
                  <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default function AdminOperationsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <OperationsContent />
    </ProtectedRoute>
  );
}