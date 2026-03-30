
"use client";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminError, AdminLoading } from "@/components/admin/admin-states";
import { getMonitoringSnapshot, type MonitoringSnapshot } from "@/lib/api/admin-api-client";

export default function MonitoringPage(){
  const [snapshot,setSnapshot]=React.useState<MonitoringSnapshot|null>(null); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState<string|null>(null);
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{setSnapshot(await getMonitoringSnapshot())}catch(err){setError(err instanceof Error?err.message:"Failed to load monitoring snapshot.")}finally{setLoading(false)}},[]);
  React.useEffect(()=>{void load()},[load]);
  return <AdminShell title="System Monitoring" description="Observe API, workers, queues, and runtime health.">
    {loading ? <AdminLoading cards={2}/> : error ? <AdminError message={error} onRetry={()=>void load()}/> : snapshot ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[
      ["API Latency (ms)",snapshot.apiLatencyMs],["Worker Status",snapshot.workerStatus],["Queue Depth",snapshot.queueDepth],["Failure Rate (%)",snapshot.failureRate],["CPU Load (%)",snapshot.cpuLoad],["Memory Usage (%)",snapshot.memoryUsage]
    ].map(([label,value])=><AdminCard key={String(label)} title={String(label)}><p className="text-3xl font-semibold tracking-tight">{value}</p></AdminCard>)}</div> : null}
  </AdminShell>
}
