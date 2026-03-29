'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Clock, CheckCircle2, ShieldCheck, Mail, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login/user');
      return;
    }
    // If the user has been approved already, redirect to dashboard
    if (user.roles.includes('ANALYST') || user.roles.includes('ADMIN')) {
      router.push(user.roles.includes('ADMIN') ? '/admin' : '/dashboard');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login/user');
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
          {/* Top gradient banner */}
          <div className="h-2 bg-linear-to-r from-violet-500 via-blue-500 to-fuchsia-500" />

          <div className="px-10 py-12 text-center">
            {/* Animated waiting icon */}
            <div className="mx-auto mb-6 relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-40" />
              <div className="relative h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-violet-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Pending Admin Approval</h1>
            <p className="text-zinc-500 mb-8 leading-relaxed">
              Your account has been created successfully. An administrator needs to review and
              approve your access before you can use the platform.
            </p>

            {/* User info */}
            <div className="bg-zinc-50 rounded-2xl p-5 mb-8 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Account Details</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                  {user.firstname?.[0]}{user.surname?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-zinc-800">{user.firstname} {user.surname}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-8 text-left">
              {[
                { icon: CheckCircle2, label: 'Account created', done: true },
                { icon: ShieldCheck, label: 'Awaiting admin review', done: false, active: true },
                { icon: CheckCircle2, label: 'Access granted to platform', done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  step.done
                    ? 'bg-emerald-50 text-emerald-700'
                    : step.active
                      ? 'bg-violet-50 text-violet-700'
                      : 'bg-zinc-50 text-zinc-400'
                }`}>
                  <step.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{step.label}</span>
                  {step.active && (
                    <span className="ml-auto text-xs bg-violet-200 text-violet-700 rounded-full px-2 py-0.5">In Progress</span>
                  )}
                </div>
              ))}
            </div>

            {/* Notify hint */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-8 text-left">
              <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                You'll receive an email notification at <strong>{user.email}</strong> once your
                account is approved.
              </p>
            </div>

            <Button
              variant="ghost"
              className="w-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-2xl"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Health Data Platform · Secure Research Access
        </p>
      </div>
    </div>
  );
}
