
"use client";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminError, AdminLoading } from "@/components/admin/admin-states";
import { getAccessSummary, type AccessSummary } from "@/lib/api/admin-api-client";

export default function AccessGovernancePage(){
  const [summary,setSummary]=React.useState<AccessSummary|null>(null); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState<string|null>(null);
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{setSummary(await getAccessSummary())}catch(err){setError(err instanceof Error?err.message:"Failed to load access summary.")}finally{setLoading(false)}},[]);
  React.useEffect(()=>{void load()},[load]);
  return <AdminShell title="Access Governance" description="Review access posture and permission allocation across the platform.">
    {loading ? <AdminLoading cards={2}/> : error ? <AdminError message={error} onRetry={()=>void load()}/> : summary ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
      ["Total Admins",summary.totalAdmins],["Total Reviewers",summary.totalReviewers],["Suspended Users",summary.totalSuspendedUsers],["Pending Access Requests",summary.pendingAccessRequests]
    ].map(([label,value])=><AdminCard key={String(label)} title={String(label)}><p className="text-3xl font-semibold tracking-tight">{value}</p></AdminCard>)}</div> : null}
  </AdminShell>
}
