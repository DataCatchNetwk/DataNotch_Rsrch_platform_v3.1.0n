"use client";

import { Badge } from "@/components/ui/badge";

export function WorkspaceRoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: "border-violet-200 bg-violet-50 text-violet-700",
    ADMIN: "border-blue-200 bg-blue-50 text-blue-700",
    RESEARCHER: "border-emerald-200 bg-emerald-50 text-emerald-700",
    VIEWER: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <Badge variant="outline" className={`rounded-full ${styles[role] ?? styles.VIEWER}`}>
      {role}
    </Badge>
  );
}

export function DatasetVisibilityBadge({ visibility }: { visibility: string }) {
  const styles: Record<string, string> = {
    PRIVATE: "border-slate-200 bg-slate-50 text-slate-700",
    WORKSPACE: "border-indigo-200 bg-indigo-50 text-indigo-700",
    PUBLIC: "border-emerald-200 bg-emerald-50 text-emerald-700",
    RESTRICTED: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="outline" className={`rounded-full ${styles[visibility] ?? styles.WORKSPACE}`}>
      {visibility}
    </Badge>
  );
}

export function AnalysisStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: "border-slate-200 bg-slate-50 text-slate-700",
    RUNNING: "border-blue-200 bg-blue-50 text-blue-700",
    SUCCEEDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
    CANCELLED: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="outline" className={`rounded-full ${styles[status] ?? styles.QUEUED}`}>
      {status}
    </Badge>
  );
}

export function ReportStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
    READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="outline" className={`rounded-full ${styles[status] ?? styles.DRAFT}`}>
      {status}
    </Badge>
  );
}