
"use client";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminError, AdminLoading } from "@/components/admin/admin-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus, type AdminUser } from "@/lib/api/admin-api-client";

export default function AdminUsersPage(){
  const [users,setUsers]=React.useState<AdminUser[]>([]); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState<string|null>(null);
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{setUsers(await getAdminUsers())}catch(err){setError(err instanceof Error?err.message:"Failed to load users.")}finally{setLoading(false)}},[]);
  React.useEffect(()=>{void load()},[load]);
  const updateRole=async(userId:string,role:AdminUser["role"])=>{const updated=await updateAdminUserRole(userId,role);setUsers(c=>c.map(i=>i.id===userId?updated:i))};
  const updateStatus=async(userId:string,status:AdminUser["status"])=>{const updated=await updateAdminUserStatus(userId,status);setUsers(c=>c.map(i=>i.id===userId?updated:i))};

  return <AdminShell title="User Management" description="View users, assign roles, and manage account status.">
    {loading ? <AdminLoading cards={1}/> : error ? <AdminError message={error} onRetry={()=>void load()}/> : <AdminCard title="Platform Users" description="System-wide identity and account management.">
      <div className="overflow-x-auto rounded-2xl border">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Institution</TableHead><TableHead>Last Login</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{users.map(user=><TableRow key={user.id}><TableCell className="font-medium">{user.fullName}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.institution}</TableCell><TableCell>{user.lastLogin}</TableCell><TableCell><Select value={user.role} onValueChange={(v)=>void updateRole(user.id,v as AdminUser["role"])}><SelectTrigger className="w-[150px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="REVIEWER">REVIEWER</SelectItem><SelectItem value="STAFF">STAFF</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent></Select></TableCell><TableCell><Select value={user.status} onValueChange={(v)=>void updateStatus(user.id,v as AdminUser["status"])}><SelectTrigger className="w-[150px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">ACTIVE</SelectItem><SelectItem value="PENDING">PENDING</SelectItem><SelectItem value="SUSPENDED">SUSPENDED</SelectItem></SelectContent></Select></TableCell></TableRow>)}</TableBody></Table>
      </div>
    </AdminCard>}
  </AdminShell>
}
