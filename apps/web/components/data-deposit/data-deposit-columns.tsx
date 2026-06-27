"use client";

import type { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DepositDatasetSummary } from '@/src/lib/api/data-deposit';

export function createDepositColumns(actions: {
  onPreview: (row: DepositDatasetSummary) => void;
  onPull: (row: DepositDatasetSummary) => void;
  onFavorite: (row: DepositDatasetSummary) => void;
}): ColumnDef<DepositDatasetSummary>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Dataset',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.name}</div>
            <div className="max-w-[480px] truncate text-xs text-muted-foreground">{item.description}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => <Badge variant="outline">{row.original.domain}</Badge>,
    },
    {
      accessorKey: 'accessibility',
      header: 'Access',
      cell: ({ row }) => <Badge>{row.original.accessibility}</Badge>,
    },
    {
      accessorKey: 'recordCount',
      header: 'Records',
      cell: ({ row }) => row.original.recordCount ?? '-',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => actions.onPreview(item)}>
              Preview
            </Button>
            <Button size="sm" onClick={() => actions.onPull(item)}>
              Pull
            </Button>
            <Button size="icon" variant="ghost" onClick={() => actions.onFavorite(item)}>
              <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        );
      },
    },
  ];
}
