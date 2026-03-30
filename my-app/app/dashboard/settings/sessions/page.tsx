'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Laptop, Loader2, ShieldCheck, Smartphone, Tablet, KeyRound, RotateCcw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/protected-route';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  changeProfilePassword,
  getProfileSecurity,
  getProfileSessions,
  revokeOtherProfileSessions,
  revokeProfileSession,
  toggleProfileTwoFactor,
  type ProfileSecurityDto,
  type ProfileSessionDto,
} from '@/lib/api/profile-api-client';

function iconForType(type: ProfileSessionDto['deviceType']) {
  if (type === 'mobile') return Smartphone;
  if (type === 'tablet') return Tablet;
  return Laptop;
}

function SessionsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function SettingsSessionsPage() {
  const router = useRouter();
  const [security, setSecurity] = useState<ProfileSecurityDto | null>(null);
  const [sessions, setSessions] = useState<ProfileSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [securityData, sessionsData] = await Promise.all([
        getProfileSecurity(),
        getProfileSessions(),
      ]);
      setSecurity(securityData);
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggle2fa = async (enabled: boolean) => {
    setActionBusy('toggle-2fa');
    try {
      const result = await toggleProfileTwoFactor({ enabled });
      setSecurity((current) =>
        current
          ? {
              ...current,
              twoFactorEnabled: result.twoFactorEnabled,
            }
          : current,
      );
      toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update 2FA setting.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setActionBusy(`revoke-${sessionId}`);
    try {
      await revokeProfileSession(sessionId);
      await load();
      toast.success('Session revoked.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke session.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleRevokeOthers = async () => {
    setActionBusy('revoke-others');
    try {
      const result = await revokeOtherProfileSessions();
      await load();
      toast.success(`Revoked ${result.revokedCount} session${result.revokedCount === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke other sessions.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setActionBusy('change-password');
    try {
      await changeProfilePassword(passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await load();
      toast.success('Password updated successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setActionBusy(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute routeKey="SETTINGS">
        <SessionsSkeleton />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute routeKey="SETTINGS">
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="ghost" className="mb-2 px-0" onClick={() => router.push('/dashboard/settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Sessions Panel</h1>
            <p className="mt-1 text-sm text-slate-500">
              Focused session management for active devices and account protection.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-violet-200 bg-violet-50 text-violet-700">Focused Section</Badge>
            <Badge variant="secondary">{sessions.filter((item) => item.status !== 'Revoked').length} Active</Badge>
          </div>
        </div>

        {error ? (
          <Alert className="rounded-2xl border-red-200 bg-red-50">
            <AlertTitle>Unable to load sessions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Live session activity with revoke controls backed by profile security APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length ? (
                sessions.map((item) => {
                  const Icon = iconForType(item.deviceType);
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.location} • {new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'Current' ? 'default' : item.status === 'Revoked' ? 'secondary' : 'outline'}>
                          {item.status}
                        </Badge>
                        {item.status !== 'Current' && item.status !== 'Revoked' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleRevokeSession(item.id)}
                            disabled={actionBusy === `revoke-${item.id}`}
                          >
                            {actionBusy === `revoke-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No active sessions were detected.</p>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => void handleRevokeOthers()}
                  disabled={actionBusy === 'revoke-others'}
                >
                  {actionBusy === 'revoke-others' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Revoke Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Security Actions</CardTitle>
              <CardDescription>Direct account hardening actions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div id="two-factor" className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                <p className="mb-3 text-xs text-slate-500">
                  Add an extra verification layer for account sign-in security.
                </p>
                <Button
                  variant={security?.twoFactorEnabled ? 'outline' : 'default'}
                  className="justify-start"
                  onClick={() => void handleToggle2fa(!(security?.twoFactorEnabled ?? false))}
                  disabled={actionBusy === 'toggle-2fa'}
                >
                  {actionBusy === 'toggle-2fa' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {security?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              <form id="password" className="rounded-xl border border-slate-200 p-3" onSubmit={handleChangePassword}>
                <p className="mb-2 text-sm font-medium text-slate-900">Reset Password</p>
                <div className="grid gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                      }
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <Button className="mt-3 justify-start" type="submit" disabled={actionBusy === 'change-password'}>
                  {actionBusy === 'change-password' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </form>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Security summary is now fully wired to backend APIs.
                </p>
              </div>

              <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/profile')}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Back to Profile Security Card
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
