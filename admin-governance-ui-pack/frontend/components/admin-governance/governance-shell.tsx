"use client";
import * as React from "react";
import { ShieldCheck } from "lucide-react";

export function GovernanceShell({
  title, description, role, children,
}: {
  title: string;
  description: string;
  role: "ADMIN" | "SUPER_ADMIN";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1550px] px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Admin Governance</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              {role}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1550px] px-6 py-6">{children}</div>
    </div>
  );
}
