import { Activity, Cpu, FileOutput, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Datasets Ingested', value: '248', icon: FileOutput },
  { label: 'Worker Jobs', value: '61', icon: Cpu },
  { label: 'Artifacts Generated', value: '1,284', icon: FileOutput },
  { label: 'Storage Used', value: '84.3 GB', icon: HardDrive },
];

export default function PipelineOverviewPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pipeline Dashboard</h1>
        <p className="text-sm text-slate-500">
          End-to-end ingestion, processing, report generation, and artifact delivery.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{item.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Worker Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed p-8 text-sm text-slate-500">
            Queue depth, worker health, stage durations, and failure triage go here.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
