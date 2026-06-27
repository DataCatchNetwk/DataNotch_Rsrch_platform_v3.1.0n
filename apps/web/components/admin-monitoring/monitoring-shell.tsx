'use client'

import * as React from 'react'

export function MonitoringShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <p className="text-sm font-medium text-slate-500">Admin Console</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950">System Monitoring</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">Observe API, workers, queues, and runtime health.</p>
        </div>
      </div>
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">{children}</main>
    </div>
  )
}
