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
  Loader2,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  UserCircle2,
  Users,
  Workflow,
  AlertTriangle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  getProfile,
  getProfileActivity,
  getProfileNotificationPreferences,
  getProfileSecurity,
  getProfileStats,
  getProfileWorkspaces,
  updateProfileNotificationPreferences,
  type ActivityItemDto,
  type NotificationPreferenceDto,
  type ProfileDto,
  type ProfileSecurityDto,
  type ProfileStatsDto,
  type ProfileWorkspaceDto,
} from "@/lib/api/profile-api-client";

function statusBadge(status?: ActivityItemDto["status"]) {
  switch (status) {
    case "Completed":
      return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Completed</Badge>;
    case "Running":
      return <Badge className="border-blue-200 bg-blue-50 text-blue-700">Running</Badge>;
    case "Pending":
      return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Pending</Badge>;
    case "Successful":
      return <Badge className="border-violet-200 bg-violet-50 text-violet-700">Successful</Badge>;
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

function LoadingSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((__, inner) => (
                  <Skeleton key={inner} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((__, inner) => (
                  <Skeleton key={inner} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert className="rounded-2xl border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Unable to load profile</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default function ProfilePageWired() {
  const [profile, setProfile] = React.useState<ProfileDto | null>(null);
  const [stats, setStats] = React.useState<ProfileStatsDto | null>(null);
  const [security, setSecurity] = React.useState<ProfileSecurityDto | null>(null);
  const [workspaces, setWorkspaces] = React.useState<ProfileWorkspaceDto | null>(null);
  const [activity, setActivity] = React.useState<ActivityItemDto[]>([]);
  const [prefs, setPrefs] = React.useState<NotificationPreferenceDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, statsRes, securityRes, workspaceRes, activityRes, prefsRes] =
        await Promise.all([
          getProfile(),
          getProfileStats(),
          getProfileSecurity(),
          getProfileWorkspaces(),
          getProfileActivity(),
          getProfileNotificationPreferences(),
        ]);

      setProfile(profileRes);
      setStats(statsRes);
      setSecurity(securityRes);
      setWorkspaces(workspaceRes);
      setActivity(activityRes);
      setPrefs(prefsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile page.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const togglePref = (key: string) => {
    setPrefs((current) =>
      current.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const updated = await updateProfileNotificationPreferences({
        preferences: prefs.map((item) => ({
          key: item.key,
          enabled: item.enabled,
        })),
      });
      setPrefs(updated);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 rounded-3xl">
                <AvatarFallback className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-xl font-semibold text-white">
                  {profile ? `${profile.firstName[0] ?? "U"}${profile.lastName[0] ?? "N"}` : "DP"}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-medium text-slate-500">Research Platform</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile?.fullName ?? "Profile"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {profile?.role && (
                    <Badge className="border-violet-200 bg-violet-50 text-violet-700">
                      {profile.role}
                    </Badge>
                  )}
                  {profile?.workspaceRole && (
                    <Badge variant="secondary" className="rounded-full">
                      {profile.workspaceRole}
                    </Badge>
                  )}
                  {profile?.accountStatus && (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {profile.accountStatus}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  {profile?.email && (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                  )}
                  {profile?.department && (
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {profile.department}
                    </span>
                  )}
                  {profile?.timezone && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.timezone}
                    </span>
                  )}
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
        {loading ? (
          <LoadingSection />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : profile && stats && security && workspaces ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Datasets Uploaded" value={stats.datasetsUploaded} helper="Research data assets" icon={Database} />
              <StatCard title="Analysis Jobs" value={stats.analysisJobsRun} helper="Runs across workspaces" icon={Workflow} />
              <StatCard title="Reports Generated" value={stats.reportsGenerated} helper="Published outputs" icon={FileText} />
              <StatCard title="Workspaces" value={stats.workspacesJoined} helper="Joined collaborative spaces" icon={FolderKanban} />
              <StatCard title="Reviewer Tasks" value={stats.reviewerTasks} helper="Assigned review workload" icon={Users} />
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
                          <Badge className={security.twoFactorEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                            {security.twoFactorEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        }
                      />
                      <InfoRow label="Password Last Changed" value={security.passwordLastChanged} />
                      <InfoRow label="Active Sessions" value={security.activeSessions} />
                      <InfoRow label="Trusted Devices" value={security.trustedDevices} />
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
                      <Button onClick={savePrefs} disabled={savingPrefs}>
                        {savingPrefs ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="mr-2 h-4 w-4" />
                        )}
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
                    <InfoRow label="Default Workspace" value={workspaces.defaultWorkspace} />
                    <InfoRow label="Joined Workspaces" value={workspaces.workspacesJoined} />
                    <InfoRow label="Owned Workspaces" value={workspaces.workspacesOwned} />
                    <InfoRow label="Pending Invitations" value={workspaces.pendingInvites} />
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void load()}>
                            Refresh Activity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        {activity.map((item) => (
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
                        <span className="font-medium">
                          {security.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Account protection uses {security.twoFactorEnabled ? "secondary verification." : "password-only sign-in."}
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <CalendarDays className="h-4 w-4 text-violet-600" />
                        <span className="font-medium">Last Login Verified</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Recent authentication activity was recorded successfully.
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Clock3 className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{workspaces.pendingInvites} Pending Invite</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Review your latest workspace membership requests.
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
          </>
        ) : (
          <ErrorState message="Profile data is unavailable." onRetry={() => void load()} />
        )}
      </main>
    </div>
  );
}
