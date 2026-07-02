'use client';

import Link from 'next/link';
import { Download, FileText, Archive, RefreshCw } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';

export default function DownloadsPage() {
  return (
    <ProtectedRoute routeKey="DOWNLOADS">
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Downloads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Access exported files, job outputs, reports, and ready-to-download datasets.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Download, label: 'Available Files', value: '0', color: 'text-indigo-600 bg-indigo-50' },
            { icon: FileText, label: 'Reports', value: '0', color: 'text-violet-600 bg-violet-50' },
            { icon: Archive, label: 'Archives', value: '0', color: 'text-fuchsia-600 bg-fuchsia-50' },
            { icon: RefreshCw, label: 'Processing', value: '0', color: 'text-amber-600 bg-amber-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border-0 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Download Contract</h2>
            <p className="mt-1 text-sm text-slate-500">Final lifecycle contract for governed delivery of generated output assets.</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
                <p className="mt-1 text-sm text-blue-950">Approved reports, visual artifacts, packaged outputs, and export metadata.</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
                <p className="mt-1 text-sm text-emerald-950">Download-ready files, signed links, archive bundles, and audit-safe delivery logs.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Delivery Shortcuts</h2>
            <p className="mt-1 text-sm text-slate-500">Navigate directly to upstream output builders and consumers.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/results">Results Workspace</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/reports">Reports</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/visualizations">Visualizations</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Download className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No downloads ready</p>
          <p className="mt-1 text-xs text-slate-500">
            Completed job outputs and exported files will appear here when ready.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
