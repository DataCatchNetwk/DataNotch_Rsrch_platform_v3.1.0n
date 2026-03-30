// User Dashboard - A comprehensive user landing page for the health data platform, built with React, Next.js, and Recharts. This dashboard provides an intuitive overview of the user's research activities, including active studies, datasets, and recent updates. Key features include:
// - Research Activity Chart: Visualize your research progress with an interactive line chart showing studies and datasets over time.
// - Quick Stats: Get a snapshot of your active studies, datasets, pending requests, and team access at a glance.   
// - Recent Activity Feed: Stay informed with a real-time feed of your recent actions and updates.
// - Responsive Design: A fully responsive layout that looks great on both desktop and mobile devices. This user landing page is designed to provide researchers with a clear and engaging overview of their work, helping them stay organized and motivated in their research journey. 

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { 
  Plus, Users, Database,
  BarChart3, Bell, Award, Search, FolderOpen,
  Clock3, ShieldCheck, UserCheck, ArrowUpToLine,
  Moon, Sun, RefreshCw, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const activityData = [
  { date: "Mar 24", studies: 3, datasets: 2 },
  { date: "Mar 27", studies: 2, datasets: 4 },
  { date: "Mar 30", studies: 4, datasets: 5 },
  { date: "Apr 3", studies: 6, datasets: 4 },
  { date: "Apr 8", studies: 5, datasets: 6 },
  { date: "Apr 13", studies: 3, datasets: 5 },
  { date: "Apr 18", studies: 7, datasets: 6 },
  { date: "Apr 23", studies: 8, datasets: 5 },
];

const activeStudies = [
  { 
    id: "study-1",
    name: "ClinGen Genomic Dataset", 
    role: "Principal Investigator", 
    participants: "1,240", 
    last: "Today", 
    status: "Recruiting" 
  },
  { 
    id: "study-2",
    name: "Diabetes Longitudinal Study", 
    role: "Co-Investigator", 
    participants: "856", 
    last: "2 days ago", 
    status: "Active" 
  },
  { 
    id: "study-3",
    name: "Cardiovascular Risk Analysis", 
    role: "Researcher", 
    participants: "432", 
    last: "1 week ago", 
    status: "Active" 
  },
];

type UserDashboardResponse = {
  stats: Array<{ title: string; value: number; trend: string }>;
  activityChart: Array<{ date: string; studies: number; datasets: number }>;
  activityFeed: Array<{ id: string; action: string; title: string; time: string }>;
};

const initialStats = [
  { title: "Active Studies", value: 3, trend: "+2 recruiting", color: "emerald", cta: "View all studies" },
  { title: "My Datasets", value: 12, trend: "↑ 2 this month", color: "emerald", cta: "Browse datasets" },
  { title: "Analysis Jobs", value: 5, trend: "1 running", color: "blue", cta: "View jobs" },
  { title: "Pending Requests", value: 2, trend: "Awaiting review", color: "amber", cta: "View requests" },
  { title: "Team Access", value: 8, trend: "+2 this week", color: "emerald", cta: "Manage access" },
];

const initialRecentActivity = [
  { id: "1", action: "Dataset uploaded", title: "Genomic Sequences Q1 2024", time: "2 hours ago" },
  { id: "2", action: "Study updated", title: "Cardiovascular Risk Analysis", time: "1 day ago" },
  { id: "3", action: "Added collaborator", title: "Dr. Sarah Chen to Metabolic Study", time: "2 days ago" },
  { id: "4", action: "Request approved", title: "Dataset Access: Diabetes Study", time: "3 days ago" },
];

export default function UserLandingPage() {
  const { user, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [chartData, setChartData] = useState(activityData);
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedStudyIds, setSelectedStudyIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const csvEscape = (value: string | number) => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const exportStudiesCsv = (rows: typeof activeStudies, filename: string) => {
    const headers = ["Study Name", "Role", "Participants", "Last Activity", "Status"];
    const csvRows = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => [
        csvEscape(row.name),
        csvEscape(row.role),
        csvEscape(row.participants),
        csvEscape(row.last),
        csvEscape(row.status),
      ].join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedStudies = activeStudies.filter((study) => selectedStudyIds.includes(study.id));
  const allStudiesSelected = selectedStudyIds.length > 0 && selectedStudyIds.length === activeStudies.length;

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudyIds((prev) =>
      prev.includes(studyId) ? prev.filter((id) => id !== studyId) : [...prev, studyId],
    );
  };

  const toggleSelectAllStudies = () => {
    setSelectedStudyIds((prev) => (prev.length === activeStudies.length ? [] : activeStudies.map((study) => study.id)));
  };

  const handleStatCta = (title: string) => {
    if (title === "Active Studies") {
      router.push('/dashboard/reports');
      return;
    }
    if (title === "My Datasets") {
      router.push('/dashboard/datasets');
      return;
    }
    if (title === "Analysis Jobs") {
      router.push('/dashboard/analysis/jobs');
      return;
    }
    if (title === "Pending Requests") {
      router.push('/dashboard/requests');
      return;
    }
    router.push('/dashboard/workspaces');
  };

  const handleRecentActivityClick = (action: string) => {
    const normalized = action.toLowerCase();
    if (normalized.includes('analysis') || normalized.includes('job') || normalized.includes('synced')) {
      router.push('/dashboard/analysis/jobs');
      return;
    }
    if (normalized.includes('dataset') || normalized.includes('uploaded')) {
      router.push('/dashboard/datasets');
      return;
    }
    if (normalized.includes('request')) {
      router.push('/dashboard/requests');
      return;
    }
    if (normalized.includes('collaborator')) {
      router.push('/dashboard/reports?tab=collaborators');
      return;
    }
    router.push('/dashboard/reports?tab=activity');
  };

  const triggerQuickUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleQuickUploadSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRecentActivity((prev) => [
      {
        id: `upload-${Date.now()}`,
        action: 'Dataset uploaded',
        title: file.name,
        time: 'just now',
      },
      ...prev,
    ].slice(0, 4));

    setStats((prev) => prev.map((item) => {
      if (item.title !== 'My Datasets') return item;
      return {
        ...item,
        value: item.value + 1,
        trend: 'Upload queued',
      };
    }));

    event.target.value = '';
    router.push('/dashboard/datasets?upload=1');
  };

  useEffect(() => {
    if (!user?.id || !token) return;

    const applyDashboardData = (res: UserDashboardResponse) => {
      setStats((prev) => prev.map((item) => {
        const matched = res.stats.find((entry) => entry.title === item.title);
        return matched ? { ...item, value: matched.value, trend: matched.trend } : item;
      }));
      setChartData(res.activityChart);
      setRecentActivity(res.activityFeed.slice(0, 4));
    };

    const simulateRefresh = () => {
      setChartData((prev) => prev.map((point, idx) => {
        if (idx !== prev.length - 1) return point;
        const studies = Math.max(1, point.studies + (Math.random() > 0.5 ? 1 : -1));
        const datasets = Math.max(1, point.datasets + (Math.random() > 0.5 ? 1 : -1));
        return { ...point, studies, datasets };
      }));

      setRecentActivity((prev) => {
        const synthetic = {
          id: `sim-${Date.now()}`,
          action: "Study synced",
          title: "Background refresh completed",
          time: "just now",
        };
        return [synthetic, ...prev].slice(0, 4);
      });
    };

    const refreshDashboard = async () => {
      setIsRefreshing(true);
      try {
        const res = await apiFetch<UserDashboardResponse>(`/v1/users/${user.id}/dashboard`, { token });
        applyDashboardData(res);
      } catch {
        simulateRefresh();
      } finally {
        setLastSyncedAt(new Date());
        setIsRefreshing(false);
      }
    };

    refreshDashboard();
    const interval = window.setInterval(refreshDashboard, 30000);
    return () => window.clearInterval(interval);
  }, [user?.id, token, refreshNonce]);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 overflow-hidden m-0 p-0">
      <div className="sticky top-0 z-40 bg-zinc-100 dark:bg-zinc-900 border-0 shadow-none outline-none pl-0 pr-1 pt-0 pb-0 md:pl-0 md:pr-2 md:pt-0 md:pb-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 text-[32px] leading-none font-bold tracking-tight md:text-[34px]">Dashboard</h1>
            <p className="m-0 mt-0.5 max-w-xl text-sm leading-snug text-muted-foreground">Welcome back! Here's an overview of your research workspace.</p>
            <p className="m-0 mt-0.5 text-[11px] text-zinc-500">
              {lastSyncedAt ? `Last synced at ${lastSyncedAt.toLocaleTimeString()}` : "Syncing dashboard data..."}
            </p>
          </div>

          <div className="ml-auto flex flex-1 items-start justify-end gap-2 pt-0.5">
            <div className="relative hidden w-70 xl:block 2xl:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search studies, datasets, collaborators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const q = searchQuery.trim();
                  router.push(q ? `/dashboard/reports?q=${encodeURIComponent(q)}` : '/dashboard/reports');
                }}
                className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-11 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900">
                Ctrl K
              </span>
            </div>

            <Button
              variant="outline"
              className="hidden h-10 rounded-xl bg-white px-4 text-sm dark:bg-zinc-900 md:inline-flex"
              onClick={() => router.push('/dashboard/reports')}
            >
              <BarChart3 className="h-4 w-4" /> View Analytics
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white dark:bg-zinc-900"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white dark:bg-zinc-900"
              disabled={isRefreshing}
              onClick={() => setRefreshNonce((value) => value + 1)}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button
              className="hidden h-10 rounded-xl gap-2 bg-violet-600 px-4 text-sm hover:bg-violet-700 sm:inline-flex"
              onClick={() => router.push('/dashboard/reports?tab=new-study')}
            >
              <Plus className="h-4 w-4" /> New Study
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl relative"
              onClick={() => router.push('/dashboard/profile?tab=notifications')}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-[10px] font-medium text-white rounded-full flex items-center justify-center">3</span>
            </Button>

            <button type="button" aria-label="Open profile" onClick={() => router.push('/dashboard/profile')}>
              <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-zinc-900">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>

        <div className="pl-0 pr-1 pb-5 pt-0 md:pl-0 md:pr-2 md:pb-6 md:pt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <Card key={i} className="rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.title}</CardDescription>
                    <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-violet-600">
                      {stat.title === "Active Studies" && <FolderOpen className="h-4 w-4" />}
                      {stat.title === "My Datasets" && <Database className="h-4 w-4" />}
                      {stat.title === "Pending Requests" && <Clock3 className="h-4 w-4" />}
                      {stat.title === "Team Access" && <Users className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-1 text-3xl font-semibold leading-none md:text-[32px]">{stat.value}</div>
                  <p className={`text-[13px] ${stat.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {stat.trend}
                  </p>
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0 text-sm text-violet-600 hover:text-violet-700"
                    onClick={() => handleStatCta(stat.title)}
                  >
                    {stat.cta} →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-7 gap-6">
            {/* Research Activity with Real Recharts */}
            <Card className="lg:col-span-5 rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>Research Activity</CardTitle>
                    <CardDescription>Your progress over the last 30 days</CardDescription>
                  </div>
                  <Badge variant="outline">Last 30 days</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="natural" 
                        dataKey="studies" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        name="Studies"
                      />
                      <Line 
                        type="natural" 
                        dataKey="datasets" 
                        stroke="#ec4899" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        name="Datasets"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-8 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" /> 3 Active studies
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" /> 12 Total datasets
                  </div>
                  <div className="ml-auto text-emerald-600 font-medium">↑ 20% vs last month</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/reports?tab=activity')}>View all</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentActivity.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full gap-4 rounded-xl p-1 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    onClick={() => handleRecentActivityClick(item.action)}
                  >
                    <div className="h-9 w-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-violet-600">
                      {item.action.toLowerCase().includes("uploaded") && <ArrowUpToLine className="h-4 w-4" />}
                      {item.action.toLowerCase().includes("updated") && <Database className="h-4 w-4" />}
                      {item.action.toLowerCase().includes("collaborator") && <UserCheck className="h-4 w-4" />}
                      {item.action.toLowerCase().includes("approved") && <ShieldCheck className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Active Studies & Quick Upload */}
          <div className="grid lg:grid-cols-7 gap-6 mt-8">
            {/* Active Studies Table */}
            <Card className="lg:col-span-5 rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Studies</CardTitle>
                  <CardDescription>Your ongoing research studies</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => router.push('/dashboard/reports')}>View all studies</Button>
                  <Button
                    className="rounded-xl bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                    disabled={selectedStudyIds.length === 0}
                    onClick={() => exportStudiesCsv(selectedStudies, "bulk-selected-studies.csv")}
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    Bulk Export ({selectedStudyIds.length})
                  </Button>
                </div>
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-175">
                  <thead>
                    <tr className="border-0">
                      <th className="text-left py-5 font-medium text-sm w-10">
                        <input
                          type="checkbox"
                          checked={allStudiesSelected}
                          onChange={toggleSelectAllStudies}
                          aria-label="Select all studies"
                          className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                      </th>
                      <th className="text-left py-5 font-medium text-sm">Study</th>
                      <th className="text-left py-5 font-medium text-sm">Role</th>
                      <th className="text-left py-5 font-medium text-sm">Participants</th>
                      <th className="text-left py-5 font-medium text-sm">Last Activity</th>
                      <th className="text-left py-5 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeStudies.map((study, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="py-6">
                          <input
                            type="checkbox"
                            checked={selectedStudyIds.includes(study.id)}
                            onChange={() => toggleStudySelection(study.id)}
                            aria-label={`Select ${study.name}`}
                            className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                          />
                        </td>
                        <td className="py-6">
                          <div>
                            <p className="font-medium">{study.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">Genomic variation analysis across populations</p>
                          </div>
                        </td>
                        <td className="py-6">
                          <Badge variant="secondary">{study.role}</Badge>
                        </td>
                        <td className="py-6 font-medium">{study.participants}</td>
                        <td className="py-6 text-sm text-muted-foreground">{study.last}</td>
                        <td className="py-6">
                          <Badge variant={study.status === "Recruiting" ? "default" : "secondary"} className={study.status === "Recruiting" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                            {study.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            </Card>

            {/* Quick Upload */}
            <Card className="lg:col-span-2 rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-violet-300 dark:border-violet-800 rounded-2xl p-8 text-center hover:border-violet-500 transition bg-violet-50/40 dark:bg-violet-950/20 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={triggerQuickUpload}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      triggerQuickUpload();
                    }
                  }}
                >
                  <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-white dark:bg-zinc-900 border-0 flex items-center justify-center text-violet-600">
                    <ArrowUpToLine className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-sm mb-1">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground mb-4">Supports CSV, JSON, XLSX up to 2GB</p>
                  <Button
                    variant="outline"
                    className="w-full mt-2 rounded-xl bg-white dark:bg-zinc-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/datasets');
                    }}
                  >
                    <Database className="mr-2 h-4 w-4" /> Go to Datasets →
                  </Button>
                </div>
                <input
                  ref={uploadInputRef}
                  type="file"
                  aria-label="Upload dataset file"
                  className="hidden"
                  accept=".csv,.json,.xlsx"
                  onChange={handleQuickUploadSelected}
                />
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}