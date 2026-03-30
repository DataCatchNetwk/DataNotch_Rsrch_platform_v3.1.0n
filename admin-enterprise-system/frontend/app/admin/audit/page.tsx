
"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminError, AdminLoading } from "@/components/admin/admin-states";
import { getAuditEvents, type AuditEvent } from "@/lib/api/admin-api-client";

export default function AuditLogsPage(){
  const [items,setItems]=React.useState<AuditEvent[]>([]); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState<string|null>(null);
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{setItems(await getAuditEvents())}catch(err){setError(err instanceof Error?err.message:"Failed to load audit events.")}finally{setLoading(false)}},[]);
  React.useEffect(()=>{void load()},[load]);
  return <AdminShell title="Audit Logs" description="Review platform events, role changes, approvals, and system activity.">
    {loading ? <AdminLoading cards={1}/> : error ? <AdminError message={error} onRetry={()=>void load()}/> : <AdminCard title="Audit Events" description="Recent high-value administrative and platform actions.">
      <div className="overflow-x-auto rounded-2xl border">
        <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Actor</TableHead><TableHead>Target</TableHead><TableHead>Time</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
        <TableBody>{items.map(item=><TableRow key={item.id}><TableCell className="font-medium">{item.action}</TableCell><TableCell>{item.actor}</TableCell><TableCell>{item.target}</TableCell><TableCell>{item.createdAt}</TableCell><TableCell><Badge variant="secondary">{item.severity}</Badge></TableCell></TableRow>)}</TableBody></Table>
      </div>
    </AdminCard>}
  </AdminShell>
}
