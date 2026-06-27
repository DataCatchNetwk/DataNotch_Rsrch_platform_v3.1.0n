'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDatasetAuditTrail } from '@/lib/api/dataset-details';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface Props {
  datasetId: string;
}

const severityConfig = {
  INFO: { icon: Info, color: 'text-blue-500', badge: 'default' as const },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-500', badge: 'secondary' as const },
  CRITICAL: { icon: AlertOctagon, color: 'text-red-500', badge: 'destructive' as const },
};

export function DatasetAuditTrail({ datasetId }: Props) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dataset-audit', datasetId],
    queryFn: () => fetchDatasetAuditTrail(datasetId),
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <ShieldCheck className="h-8 w-8 opacity-40" />
        <p className="text-sm">No audit events found for this dataset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.map((event) => {
        const cfg = severityConfig[event.severity as keyof typeof severityConfig] ?? severityConfig.INFO;
        const Icon = cfg.icon;
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-md border border-border/50 bg-card px-3 py-2 text-sm"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{event.action.replace(/_/g, ' ')}</span>
                <Badge variant={cfg.badge} className="text-xs">
                  {event.severity}
                </Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{event.actor}</span>
                <span>·</span>
                <span className="shrink-0">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
