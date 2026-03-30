'use client';

import { Settings, Bell, ShieldCheck, Palette, Globe } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';

const settingsSections = [
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Control how and when you receive alerts and notifications.',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'Security & Privacy',
    description: 'Manage two-factor authentication, sessions, and data privacy settings.',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    id: 'appearance',
    icon: Palette,
    title: 'Appearance',
    description: 'Customize the platform theme, display density, and layout preferences.',
    color: 'text-fuchsia-600 bg-fuchsia-50',
  },
  {
    id: 'integrations',
    icon: Globe,
    title: 'Integrations',
    description: 'Connect external tools, APIs, and data sources to your workspace.',
    color: 'text-emerald-600 bg-emerald-50',
  },
];

export default function SettingsPage() {
  return (
    <ProtectedRoute routeKey="SETTINGS">
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account preferences, platform settings, and integrations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {settingsSections.map(({ id, icon: Icon, title, description, color }) => (
            <button
              key={id}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-indigo-300 transition"
            >
              <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 bg-slate-100">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">General Settings</p>
              <p className="text-xs text-slate-500">Platform-wide configuration options</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic">Full settings panel coming soon.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
