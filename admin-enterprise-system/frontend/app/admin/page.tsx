
"use client";
import * as React from "react";
import Link from "next/link";
import { Activity, ClipboardList, Database, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, AdminLoading } from "@/components/admin/admin-states";
import { getAdminOverview, type AdminOverview } from "@/lib/api/admin-api-client";

export default function AdminDashboardPage() {
  const [overview,setOverview]=React.useState<AdminOverview|null>(null);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState<string|null>(null);
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{setOverview(await getAdminOverview())}catch(err){setError(err instanceof Error?err.message:"Failed to load admin overview.")}finally{setLoading(false)}},[]);
  React.useEffect(()=>{void load()},[load]);

  return <AdminShell title="Admin Dashboard" description="System-wide platform control, approvals, governance, and monitoring.">
    {loading ? <AdminLoading cards={3}/> : error ? <AdminError message={error} onRetry={()=>void load()}/> : overview ? (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.totalUsers} total users</Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.activeSessions} active sessions</Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.totalDatasets} datasets</Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.runningJobs} running jobs</Badge>
          <Badge className={overview.systemHealth==="Healthy"?"rounded-full border-emerald-200 bg-emerald-50 text-emerald-700":"rounded-full border-amber-200 bg-amber-50 text-amber-700"}>{overview.systemHealth}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Total Users",overview.totalUsers,Users],
            ["Active Sessions",overview.activeSessions,Shield],
            ["Total Datasets",overview.totalDatasets,Database],
            ["Running Jobs",overview.runningJobs,Activity],
            ["Pending Approvals",overview.pendingApprovals,ClipboardList],
          ].map(([label,value,Icon]:any)=><Card key={label} className="rounded-2xl border-0 shadow-sm"><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></div><div className="rounded-2xl border bg-slate-50 p-3 text-violet-600"><Icon className="h-5 w-5"/></div></CardContent></Card>)}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Link href="/admin/registrations"><Card className="rounded-2xl border-0 shadow-sm transition hover:shadow-md"><CardContent className="p-6"><h3 className="text-xl font-semibold text-slate-950">Registration Queue</h3><p className="mt-2 text-sm text-slate-600">Review, approve, or reject new platform access requests.</p></CardContent></Card></Link>
          <Link href="/admin/access"><Card className="rounded-2xl border-0 shadow-sm transition hover:shadow-md"><CardContent className="p-6"><h3 className="text-xl font-semibold text-slate-950">Access Governance</h3><p className="mt-2 text-sm text-slate-600">Manage roles, status transitions, and access boundaries.</p></CardContent></Card></Link>
        </div>
      </div>
    ) : null}
  </AdminShell>
}
