'use client';

import { Download, ServerCog, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MonitoringOperationsActionsCard({
  onRestartWorkers,
  onRunHealthCheck,
  onExportLogs,
}: {
  onRestartWorkers: () => void;
  onRunHealthCheck: () => void;
  onExportLogs: () => void;
}) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Operations Actions</CardTitle>
        <CardDescription>Immediate operational actions for admins on duty.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start" onClick={onRestartWorkers}>
          <ServerCog className="mr-2 h-4 w-4" />Restart Worker Cluster
        </Button>
        <Button variant="outline" className="justify-start" onClick={onRunHealthCheck}>
          <ShieldCheck className="mr-2 h-4 w-4" />Run Health Check
        </Button>
        <Button variant="outline" className="justify-start" onClick={onExportLogs}>
          <Download className="mr-2 h-4 w-4" />Export Monitoring Logs
        </Button>
      </CardContent>
    </Card>
  );
}