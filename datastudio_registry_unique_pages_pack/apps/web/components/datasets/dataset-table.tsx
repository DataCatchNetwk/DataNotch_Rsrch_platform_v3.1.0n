'use client';

import { ArrowRight, BarChart3, Eye, GitBranch, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RegistryDataset } from '@/lib/api/dataset-registry';

export function DatasetTable({
  datasets,
  handoffLabel,
  onHandoff,
}: {
  datasets: RegistryDataset[];
  handoffLabel: string;
  onHandoff: (dataset: RegistryDataset) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Inventory</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-3">Dataset</th>
              <th>Source</th>
              <th>Owner</th>
              <th>Records</th>
              <th>Variables</th>
              <th>Quality</th>
              <th>Status</th>
              <th>Version</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-4">
                  <div className="font-semibold">{d.name}</div>
                  <div className="flex gap-1 pt-1">
                    {d.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </td>
                <td>{d.source}</td>
                <td>{d.owner}</td>
                <td>{d.records.toLocaleString()}</td>
                <td>{d.variables}</td>
                <td>{d.qualityScore}%</td>
                <td><Badge className="bg-emerald-100 text-emerald-700">{d.status}</Badge></td>
                <td>{d.version}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" />Profile</Button>
                    <Button variant="outline" size="sm"><GitBranch className="mr-1 h-4 w-4" />Lineage</Button>
                    <Button variant="outline" size="sm"><BarChart3 className="mr-1 h-4 w-4" />Quality</Button>
                    <Button size="sm" className="bg-slate-950" onClick={() => onHandoff(d)}>
                      {handoffLabel}<ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function GovernanceStrip() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card><CardContent className="p-4"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div className="mt-2 font-semibold">Audit Ready</div><p className="text-sm text-slate-500">Version, owner, profile, and handoff actions are logged.</p></CardContent></Card>
      <Card><CardContent className="p-4"><GitBranch className="h-5 w-5 text-violet-600" /><div className="mt-2 font-semibold">Lineage Enabled</div><p className="text-sm text-slate-500">Every dataset stage links to upstream and downstream assets.</p></CardContent></Card>
      <Card><CardContent className="p-4"><BarChart3 className="h-5 w-5 text-blue-600" /><div className="mt-2 font-semibold">Analytics Handoff</div><p className="text-sm text-slate-500">Feature sets can be sent directly to Analysis Studio.</p></CardContent></Card>
    </div>
  );
}
