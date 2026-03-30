'use client';

import Link from 'next/link';
import type { PipelineState } from '@/lib/types/pipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PipelineTable({ items }: { items: PipelineState[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Pipeline Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Dataset</th>
                <th className="py-3 pr-4">Priority</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Current Stage</th>
                <th className="py-3 pr-4">Updated</th>
                <th className="py-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{item.name}</td>
                  <td className="py-3 pr-4">{item.datasetId}</td>
                  <td className="py-3 pr-4">{item.priority}</td>
                  <td className="py-3 pr-4">{item.status}</td>
                  <td className="py-3 pr-4">{item.currentStage ?? '—'}</td>
                  <td className="py-3 pr-4">{new Date(item.updatedAt).toLocaleString()}</td>
                  <td className="py-3">
                    <Link className="font-medium underline underline-offset-4" href={`/monitoring/pipelines/${item.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={7}>
                    No pipelines yet.
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
