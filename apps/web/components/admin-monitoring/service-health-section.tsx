'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceHealthItem } from '@/lib/api/system-monitoring-api-client';

function serviceBadge(status: ServiceHealthItem['status']) {
  if (status === 'Online') return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Online</Badge>;
  if (status === 'Degraded') return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Degraded</Badge>;
  return <Badge className="border-red-200 bg-red-50 text-red-700">Offline</Badge>;
}

export function MonitoringServiceHealthSection({ services }: { services: ServiceHealthItem[] }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Service Health</CardTitle>
        <CardDescription>Component-level runtime visibility for the platform stack.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.key} className="rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-950">{service.title}</p>
              {serviceBadge(service.status)}
            </div>
            <p className="mt-1.5 text-sm text-slate-600">{service.helper}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}