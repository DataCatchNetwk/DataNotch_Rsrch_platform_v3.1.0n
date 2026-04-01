"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DepositPreviewResponse } from '@/src/lib/api/data-deposit';

export function DataDepositPreviewModal({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preview: DepositPreviewResponse | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{preview?.dataset.name ?? 'Dataset Preview'}</DialogTitle>
          <DialogDescription>
            Sample preview of the dataset with first rows and schema metadata.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="text-sm text-muted-foreground">Loading preview...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-3 text-sm">
                <div className="text-muted-foreground">Domain</div>
                <div className="mt-1 font-medium">{preview.dataset.domain}</div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="text-muted-foreground">Access</div>
                <div className="mt-1 font-medium">{preview.dataset.accessibility}</div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="text-muted-foreground">Records</div>
                <div className="mt-1 font-medium">{preview.dataset.recordCount ?? '-'}</div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="text-muted-foreground">Generated</div>
                <div className="mt-1 font-medium">{new Date(preview.generatedAt).toLocaleString()}</div>
              </div>
            </div>

            <ScrollArea className="h-90 rounded-xl border">
              <div className="min-w-max p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {preview.columns.map((column) => (
                        <th key={column} className="border-b px-3 py-2 text-left font-medium">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        {preview.columns.map((column) => (
                          <td key={column} className="px-3 py-2 align-top">
                            {String(row[column] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
