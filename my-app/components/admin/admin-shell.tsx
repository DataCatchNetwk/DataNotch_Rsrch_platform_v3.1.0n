'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ClipboardList, Lock, ScrollText, Shield, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/governance', label: 'Governance Center', icon: ShieldCheck },
  { href: '/admin/access', label: 'Access Governance', icon: Lock },
  { href: '/admin/registrations', label: 'Registration Queue', icon: ClipboardList },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/monitoring', label: 'System Monitoring', icon: Activity },
];

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleLabel = ['SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'STAFF', 'USER'].find((role) => user?.roles.includes(role)) ?? 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-screen-2xl px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Admin Console</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
            <div className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Role: {roleLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-screen-2xl gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}