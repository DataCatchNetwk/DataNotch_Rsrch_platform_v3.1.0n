"use client";

import { Badge } from "@/components/ui/badge";

export function NotificationSeverityBadge({
  severity,
}: {
  severity: "info" | "success" | "warning";
}) {
  const cls =
    severity === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : severity === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <Badge variant="outline" className={`rounded-full ${cls}`}>
      {severity.toUpperCase()}
    </Badge>
  );
}
