
"use client";
import * as React from "react";

export function MonitoringShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1550px] px-6 py-8">
          <p className="text-sm font-medium text-slate-500">Admin Console</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">System Monitoring</h1>
          <p className="mt-3 text-base text-slate-600">Observe API, workers, queues, and runtime health.</p>
        </div>
      </div>
      <main className="mx-auto max-w-[1550px] space-y-6 px-6 py-6">{children}</main>
    </div>
  );
}
