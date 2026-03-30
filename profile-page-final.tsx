\
"use client";

import * as React from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Edit3,
  FileText,
  Fingerprint,
  FolderKanban,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  ShieldCheck,
  UserCircle2,
  Users,
  Workflow,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ActivityItem = {
  id: string;
  type: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace";
  title: string;
  meta: string;
  time: string;
  status?: "Completed" | "Running" | "Pending" | "Successful";
};

const profile = {
  firstName: "Jerry",
  lastName: "Godwin",
  fullName: "Jerry Godwin",
  email: "jgodwin@datanotchplatform.org",
  role: "ANALYST",
  institution: "DataNotch Research Platform",
  department: "Clinical Analytics",
  researchGroup: "Metabolic Risk Lab",
  timezone: "America/New_York",
  memberSince: "Jan 12, 2026",
  lastLogin: "Mar 30, 2026 • 12:31 PM",
  accountStatus: "Active",
  workspaceRole: "Researcher",
  accessLevel: "Restricted",
  reviewAccess: "Enabled",
  approvalAuthority: "None",
  twoFactorEnabled: true,
  passwordLastChanged: "Feb 18, 2026",
  activeSessions: 3,
  trustedDevices: 2,
  workspacesJoined: 6,
  workspacesOwned: 2,
  pendingInvites: 1,
  defaultWorkspace: "Diabetes Study",
  datasetsUploaded: 28,
  analysisJobsRun: 112,
  reportsGenerated: 19,
  pipelinesUsed: 14,
  reviewerTasks: 7,
};

const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "Analysis",
    title: "Glucose Trend Forecast v2",
    meta: "Analysis job completed successfully",
    time: "Today • 11:45 AM",
    status: "Completed",
  },
  {
    id: "2",
    type: "Dataset",
    title: "clinical_panel_march.xlsx",
    meta: "New dataset uploaded to Metabolic Risk workspace",
    time: "Today • 10:10 AM",
    status: "Successful",
  },
  {
    id: "3",
    type: "Report",
    title: "A1C Clustering Summary",
    meta: "Report package downloaded",
    time: "Yesterday • 4:22 PM",
  },
  {
    id: "4",
    type: "Security",
    title: "New browser sign-in",
    meta: "Firefox on Windows verified with 2FA",
    time: "Yesterday • 8:01 AM",
    status: "Successful",
  },
  {
    id: "5",
    type: "Workspace",
    title: "Adherence Lab invitation",
    meta: "Pending workspace invitation received",
    time: "Mar 28 • 6:17 PM",
    status: "Pending",
  },
];

const notificationPrefs = [
  {
    key: "jobComplete",
    title: "Job completion alerts",
    description: "Notify me when an analysis job completes.",
    enabled: true,
  },
  {
    key: "jobFailed",
    title: "Failed job alerts",
    description: "Notify me when a job fails or is cancelled.",
    enabled: true,
  },
  {
    key: "reviewerAssigned",
    title: "Reviewer assignments",
    description: "Notify me when a reviewer task is assigned.",
    enabled: true,
  },
  {
    key: "workspaceInvites",
    title: "Workspace invitations",
    description: "Notify me about collaborator and workspace invites.",
    enabled: true,
  },
  {
    key: "securityAlerts",
    title: "Security alerts",
    description: "Notify me about new sign-ins and sensitive changes.",
    enabled: true,
  },
  {
    key: "productUpdates",
    title: "Product updates",
    description: "Send occasional product and release updates.",
    enabled: false,
  },
];

function statusBadge(status?: ActivityItem["status"]) {
  switch (status) {
    case "Completed":
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
    case "Running":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>;
    case "Pending":
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    case "Successful":
      return <Badge className="bg-violet-50 text-violet-700 border-violet-200">Successful</Badge>;
    default:
      return null;
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-right text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{helper}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-2.5 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [prefs, setPrefs] = React.useState(notificationPrefs);

  const togglePref = (key: string) => {
    setPrefs((current) =>
      current.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 rounded-3xl">
                <AvatarFallback className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-xl font-semibold text-white">
                  JG
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-medium text-slate-500">Research Platform</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile.fullName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700">
                    {profile.role}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full">
                    {profile.workspaceRole}
                  </Badge>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {profile.accountStatus}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {profile.department}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.timezone}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Security Settings
              </Button>
              <Button variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                View Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Datasets Uploaded"
            value={profile.datasetsUploaded}
            helper="Research data assets"
            icon={Database}
          />
          <StatCard
            title="Analysis Jobs"
            value={profile.analysisJobsRun}
            helper="Runs across workspaces"
            icon={Workflow}
          />
          <StatCard
            title="Reports Generated"
            value={profile.reportsGenerated}
            helper="Published outputs"
            icon={FileText}
          />
          <StatCard
            title="Workspaces"
            value={profile.workspacesJoined}
            helper="Joined collaborative spaces"
            icon={FolderKanban}
          />
          <StatCard
            title="Reviewer Tasks"
            value={profile.reviewerTasks}
            helper="Assigned review workload"
            icon={Users}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Profile & Credentials</CardTitle>
                <CardDescription>
                  Core identity, institutional affiliation, and account details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="First Name" value={profile.firstName} />
                <InfoRow label="Surname" value={profile.lastName} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow label="Institution" value={profile.institution} />
                <InfoRow label="Department" value={profile.department} />
                <InfoRow label="Research Group" value={profile.researchGroup} />
                <InfoRow label="Global Role" value={profile.role} />
                <InfoRow label="Timezone" value={profile.timezone} />
                <InfoRow label="Member Since" value={profile.memberSince} />
                <InfoRow label="Last Login" value={profile.lastLogin} />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Roles & Access</CardTitle>
                  <CardDescription>
                    Platform and workspace-level access controls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoRow label="Global Role" value={profile.role} />
                  <InfoRow label="Workspace Role" value={profile.workspaceRole} />
                  <InfoRow label="Access Level" value={profile.accessLevel} />
                  <InfoRow label="Review Access" value={profile.reviewAccess} />
                  <InfoRow label="Approval Authority" value={profile.approvalAuthority} />
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      Request Elevated Access
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Authentication, recovery, and session controls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoRow
                    label="Two-Factor Authentication"
                    value={
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    }
                  />
                  <InfoRow label="Password Last Changed" value={profile.passwordLastChanged} />
                  <InfoRow label="Active Sessions" value={profile.activeSessions} />
                  <InfoRow label="Trusted Devices" value={profile.trustedDevices} />
                  <div className="grid gap-2 pt-4">
                    <Button variant="outline" className="justify-start">
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Manage 2FA
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Laptop className="mr-2 h-4 w-4" />
                      Manage Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control alerts for jobs, requests, collaboration, and security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {prefs.map((item, index) => (
                  <div key={item.key}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      </div>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => togglePref(item.key)}
                      />
                    </div>
                    {index < prefs.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
                <div className="pt-2">
                  <Button>
                    <Bell className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Workspace Membership</CardTitle>
                <CardDescription>
                  Summary of your active research collaboration footprint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Default Workspace" value={profile.defaultWorkspace} />
                <InfoRow label="Joined Workspaces" value={profile.workspacesJoined} />
                <InfoRow label="Owned Workspaces" value={profile.workspacesOwned} />
                <InfoRow label="Pending Invitations" value={profile.pendingInvites} />
                <div className="grid gap-2 pt-4">
                  <Button variant="outline" className="justify-start">
                    <FolderKanban className="mr-2 h-4 w-4" />
                    View All Workspaces
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Invitations
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>
                  Compliance, export, and personal data controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow
                  label="Data Usage Policy"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Accepted
                    </span>
                  }
                />
                <InfoRow
                  label="Compliance Status"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Verified
                    </span>
                  }
                />
                <InfoRow label="Export Availability" value="Enabled" />
                <div className="grid gap-2 pt-4">
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View Terms & Policy
                  </Button>
                  <Button variant="outline" className="justify-start text-red-600">
                    <Lock className="mr-2 h-4 w-4" />
                    Request Account Deletion
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest platform, workspace, and security events.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-700">{item.type}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.meta}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{item.time}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Security Snapshot</CardTitle>
                <CardDescription>
                  Fast view of your current protection status.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">2FA Enabled</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Account protected with secondary verification.
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <CalendarDays className="h-4 w-4 text-violet-600" />
                    <span className="font-medium">Last Login Verified</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Recent authentication activity looks normal.
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    <span className="font-medium">1 Pending Invite</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Review your latest workspace membership request.
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <UserCircle2 className="h-4 w-4 text-sky-600" />
                    <span className="font-medium">Access Scoped</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Your current research access level is {profile.accessLevel.toLowerCase()}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
