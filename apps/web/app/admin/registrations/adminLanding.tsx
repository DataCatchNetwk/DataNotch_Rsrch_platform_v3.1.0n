/// Admin Dashboard - A comprehensive admin landing page for the health data platform, built with React, Next.js, and TanStack Table. This dashboard provides real-time insights into user activity, study management, and audit logs, all within a sleek and modern interface. Key features include:
// - Real-time Activity Chart: Visualize user logins and audit events with an auto-updating line chart.
// - Audit Log with Export: View recent audit events and export them as CSV for compliance and review.
// - Active Studies Table: Manage ongoing studies with advanced filtering, sorting, and pagination powered by TanStack Table.
// - Responsive Design: A fully responsive layout that looks great on both desktop and mobile devices.
// - Theme Toggle: Switch between light and dark modes for optimal viewing comfort. This admin landing page is designed to empower administrators with the tools they need to effectively oversee the health data platform and ensure smooth operations.        

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Users, BarChart3, FileText, Clock, ShieldAlert, 
  Plus, Bell, Search, LogOut, Sun, Moon, Download, Filter, Settings, CheckCircle2, UserCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

type Study = {
  name: string;
  type: string;
  participants: string;
  progress: string;
  lastUpdated: string;
  status: "Active" | "Recruiting" | "Completed";
};

// Initial Data
const initialActivityData = [
  { date: "Mar 6", logins: 18, audits: 24 },
  { date: "Mar 9", logins: 25, audits: 19 },
  { date: "Mar 12", logins: 32, audits: 28 },
  { date: "Mar 15", logins: 45, audits: 31 },
  { date: "Mar 18", logins: 38, audits: 35 },
  { date: "Mar 21", logins: 42, audits: 29 },
  { date: "Mar 24", logins: 51, audits: 44 },
];

const initialAuditLogs = [
  { user: "Katie Miller", action: "Inactive session detected", time: "4 min ago", detail: "Upload session lost" },
  { user: "Ashley Thompson", action: "Deleted 'Heart Health Project'", time: "27 min ago", detail: "" },
];

type AdminOverviewResponse = {
  stats: {
    totalUsers: number;
    activeStudies: number;
    newLogs: number;
    alerts: number;
  };
  activityData: Array<{ date: string; logins: number; audits: number }>;
  auditLogs: Array<{ user: string; action: string; time: string; detail: string }>;
};

const initialStudies: Study[] = [
  { name: "ClinGen Genomic", type: "DATASET", participants: "1,993", progress: "83%", lastUpdated: "Today", status: "Active" },
  { name: "Diabetes Longitudinal Study", type: "FRAG", participants: "1,926", progress: "67%", lastUpdated: "2 days ago", status: "Recruiting" },
  { name: "Cardiovascular Risk Study", type: "ACTIVE", participants: "1,246", progress: "91%", lastUpdated: "1 week ago", status: "Active" },
  { name: "Metabolic Syndrome Analysis", type: "COHORT", participants: "892", progress: "54%", lastUpdated: "3 days ago", status: "Completed" },
];

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [activityData, setActivityData] = useState(initialActivityData);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [studies] = useState(initialStudies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [stats, setStats] = useState({
    totalUsers: 1482,
    activeStudies: 58,
    newLogs: 1243,
    alerts: 2,
  });

  type PendingUser = { id: string; firstname: string; surname: string; email: string; createdAt: string };
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    const loadOverview = () => {
      apiFetch<AdminOverviewResponse>('/v1/users/admin/overview', { token })
        .then((res) => {
          setStats(res.stats);
          setActivityData(res.activityData);
          setAuditLogs(res.auditLogs);
        })
        .catch(() => {});
    };

    loadOverview();
    const interval = window.setInterval(loadOverview, 30000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch pending users on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;
    apiFetch<{ users: PendingUser[] }>('/v1/users/pending', { token })
      .then((res) => setPendingUsers(res.users))
      .catch(() => {});
  }, []);

  const handleApprove = async (userId: string, name: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;
    setApprovingId(userId);
    try {
      await apiFetch(`/v1/users/${userId}/approve`, { method: 'POST', token });
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`${name} approved`, { description: 'User now has researcher access.' });
    } catch {
      toast.error('Approval failed', { description: 'Could not approve this user.' });
    } finally {
      setApprovingId(null);
    }
  };

  // Export functions
  const exportAuditLog = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + auditLogs.map(log => `${log.user},${log.action},${log.time}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log exported as CSV");
  };

  const exportStudies = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + studies.map(s => `${s.name},${s.type},${s.participants},${s.progress}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "active_studies.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Studies exported as CSV");
  };

  // TanStack Table with filters and pagination
  const columns: ColumnDef<Study>[] = [
    { accessorKey: "name", header: "Study Name" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "participants", header: "Participants" },
    { 
      accessorKey: "progress", 
      header: "Progress",
      cell: ({ row }) => <span className="text-emerald-400 font-medium">{row.original.progress}</span>
    },
    { accessorKey: "lastUpdated", header: "Last Updated" },
    { accessorKey: "status", header: "Status" },
  ];

  const filteredStudies = studies.filter(study => {
    const matchesSearch = study.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || study.status === statusFilter;
    const matchesType = typeFilter === "All" || study.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const table = useReactTable({
    data: filteredStudies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="border-r border-zinc-800">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">DN</span>
              </div>
              <div>
                <p className="font-semibold text-2xl tracking-tight">DataNotch</p>
                <p className="text-xs text-zinc-400">Admin Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { icon: BarChart3, label: "Dashboard", active: true },
                    { icon: Users, label: "Users" },
                    { icon: Users, label: "Research" },
                    { icon: FileText, label: "Reports" },
                    { icon: Clock, label: "Logs" },
                    { icon: ShieldAlert, label: "API & Keys" },
                    { icon: Settings, label: "Settings" },
                  ].map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton isActive={item.active}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-semibold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search studies, datasets..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl py-2.5 pl-11 text-sm focus:outline-none focus:border-violet-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px]">2</div>
              </Button>

              <div className="flex items-center gap-3">
                <Switch
                  checked={theme === "light"}
                  onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                />
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>

              <Avatar className="h-9 w-9">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AT</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Welcome back, Ashley! 👋</h1>
                <p className="text-zinc-400 mt-1">Here&apos;s what&apos;s happening with the health data platform today.</p>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700 rounded-2xl px-6">
                <Plus className="mr-2 h-4 w-4" /> New Study
              </Button>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { title: "Total Users", value: stats.totalUsers.toLocaleString(), change: "+1.9%" },
                { title: "Active Studies", value: stats.activeStudies, change: "+4.3%" },
                { title: "New Logs", value: stats.newLogs.toLocaleString(), change: "+7.2%" },
                { title: "System Alerts", value: stats.alerts, change: "Critical", alert: true },
              ].map((stat, i) => (
                <Card key={i} className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardDescription>{stat.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">{stat.value}</div>
                    {stat.alert ? (
                      <div className="text-amber-500 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Critical
                      </div>
                    ) : (
                      <p className="text-emerald-500 text-sm">{stat.change} since last period</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Left Column: Activity Chart & Audit Log (spans 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Activity Chart */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Activity Overview</CardTitle>
                      <Badge variant="outline">Last 30 days</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={activityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip />
                          <Legend />
                          <Line type="natural" dataKey="logins" stroke="#a5b4fc" strokeWidth={4} name="Logins" />
                          <Line type="natural" dataKey="audits" stroke="#f472b6" strokeWidth={4} name="Audits" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Log */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Audit Log</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportAuditLog} className="rounded-2xl">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {auditLogs.map((log, i) => (
                      <div key={i} className="flex gap-4">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{log.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          {log.detail && <p className="text-sm text-zinc-400">{log.detail}</p>}
                          <p className="text-xs text-zinc-500 mt-1">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Quick Upload, Active Studies, Metrics */}
              <div className="space-y-6">
                {/* Quick Upload */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Quick Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 text-center hover:border-violet-500 transition">
                        <div className="text-3xl mb-2">📁</div>
                        <p className="text-sm font-medium">Drag files here</p>
                        <p className="text-xs text-zinc-400">or click to select</p>
                      </div>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 rounded-2xl">
                        Choose File
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Studies Widget */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg">Active Studies</CardTitle>
                    <span className="text-2xl font-bold text-violet-400">{stats.activeStudies}</span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studies.slice(0, 2).map((study, i) => (
                      <div key={i} className="pb-3 border-b border-zinc-800 last:border-b-0">
                        <p className="font-medium text-sm">{study.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">{study.type}</Badge>
                          <span className="text-emerald-400 text-xs font-medium">{study.progress}</span>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-violet-400 hover:text-violet-300 text-sm mt-2">
                      View All →
                    </Button>
                  </CardContent>
                </Card>

                {/* System Metrics */}
                <Card className="bg-linear-to-br from-violet-600/20 to-pink-600/20 border-violet-500/30 rounded-3xl">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-12 rounded-xl bg-violet-600/30 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">75.1k</p>
                        <p className="text-xs text-zinc-400">requests</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* API Usage */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">API Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Quota</span>
                        <span className="text-emerald-400 font-medium">68%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-[68%]"></div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full rounded-2xl text-sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>

                {/* Server Status */}
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Server Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Server A1", status: "Healthy", color: "text-emerald-400" },
                      { name: "Server B2", status: "Regional", color: "text-amber-400" },
                      { name: "Server C3", status: "Distributed", color: "text-blue-400" },
                    ].map((server, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{server.name}</span>
                        <Badge variant="outline" className={`text-xs ${server.color}`}>
                          {server.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <Card className="bg-amber-950/20 border-amber-500/30 rounded-3xl">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-amber-300">Pending Approvals</CardTitle>
                    <p className="text-xs text-amber-500 mt-0.5">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting access</p>
                  </div>
                  <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                    {pendingUsers.length} pending
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 bg-zinc-900/60 rounded-2xl px-4 py-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs font-semibold">
                          {u.firstname[0]}{u.surname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.firstname} {u.surname}</p>
                        <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
                        disabled={approvingId === u.id}
                        onClick={() => handleApprove(u.id, `${u.firstname} ${u.surname}`)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approvingId === u.id ? 'Approving…' : 'Approve'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Full-Width Active Studies Table */}
            <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <CardTitle>All Studies</CardTitle>
                  <div className="flex gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 rounded-2xl">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Recruiting">Recruiting</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40 rounded-2xl">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="DATASET">Dataset</SelectItem>
                        <SelectItem value="FRAG">Fragment</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COHORT">Cohort</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={exportStudies} className="rounded-2xl">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl overflow-hidden border border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        {table.getHeaderGroups()[0].headers.map(header => (
                          <th key={header.id} className="text-left py-4 px-6 font-medium text-sm">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="py-5 px-6">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length} className="py-12 text-center text-zinc-400">
                            No studies found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-zinc-400">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredStudies.length)} of{" "}
                    {filteredStudies.length} studies
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="rounded-2xl"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="rounded-2xl"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
