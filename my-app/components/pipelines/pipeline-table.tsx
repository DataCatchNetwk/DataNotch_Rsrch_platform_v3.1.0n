"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineRun } from "@/src/lib/api/workspaces";

function formatTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function PipelineTable({ runs }: { runs: PipelineRun[] }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Pipeline Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Workspace</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Progress</th>
                <th className="py-3 pr-4">Current Stage</th>
                <th className="py-3 pr-4">Updated</th>
                <th className="py-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const current = run.steps.find((step) => step.order === run.currentStepIndex) ?? run.steps.find((step) => step.status === "RUNNING");
                return (
                  <tr className="border-b last:border-0" key={run.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{run.name}</td>
                    <td className="py-3 pr-4 text-slate-700">{run.workspaceId}</td>
                    <td className="py-3 pr-4 text-slate-700">{run.status}</td>
                    <td className="py-3 pr-4 text-slate-700">{Math.round(run.progressPercent)}%</td>
                    <td className="py-3 pr-4 text-slate-700">{current?.type ?? "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{formatTime(run.updatedAt)}</td>
                    <td className="py-3">
                      <Link className="font-medium text-blue-700 hover:underline" href={`/dashboard/monitoring/pipelines/${run.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!runs.length ? (
                <tr>
                  <td className="py-8 text-center text-slate-500" colSpan={7}>
                    No pipelines available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
