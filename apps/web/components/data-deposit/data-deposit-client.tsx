"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';

import {
  getDepositPullStatusStreamUrl,
  getDepositPullStatus,
  listDepositDatasets,
  previewDepositDataset,
  pullDepositDataset,
  toggleFavoriteDataset,
  type PullDepositStatusResponse,
  type DepositDatasetSummary,
  type DepositPreviewResponse,
  type PullDepositResponse,
} from '@/src/lib/api/data-deposit';
import { getMyWorkspaces, type Workspace } from '@/src/lib/api/workspaces';
import { createDepositColumns } from '@/components/data-deposit/data-deposit-columns';
import { DataDepositPreviewModal } from '@/components/data-deposit/data-deposit-preview-modal';
import { DataDepositPullModal } from '@/components/data-deposit/data-deposit-pull-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DOMAINS = [
  'ALL',
  'HEALTH',
  'SOCIAL',
  'CLIMATE',
  'ECONOMIC',
  'DEMOGRAPHIC',
  'EDUCATION',
  'ENVIRONMENT',
  'MOBILITY',
  'GENOMICS',
  'IMAGING',
  'WEARABLE',
  'SURVEY',
  'OTHER',
] as const;

export function DataDepositClient({ onBackToDatasets }: { onBackToDatasets?: () => void } = {}) {
  const router = useRouter();
  const [items, setItems] = useState<DepositDatasetSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState<string>('ALL');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<DepositPreviewResponse | null>(null);
  const [pullOpen, setPullOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DepositDatasetSummary | null>(null);
  const [lastPullJob, setLastPullJob] = useState<
    (PullDepositResponse & Partial<PullDepositStatusResponse> & { datasetName: string }) | null
  >(null);

  useEffect(() => {
    if (!lastPullJob?.jobId) {
      return;
    }

    const terminalStatuses = new Set(['COMPLETED', 'FAILED', 'CANCELED']);
    if (terminalStatuses.has(String(lastPullJob.status))) {
      return;
    }

    let pollInterval: number | null = null;
    let closed = false;
    const eventSource = new EventSource(getDepositPullStatusStreamUrl(lastPullJob.jobId));

    const startPollingFallback = () => {
      if (pollInterval !== null) {
        return;
      }

      pollInterval = window.setInterval(() => {
        void (async () => {
          try {
            const status = await getDepositPullStatus(lastPullJob.jobId);
            setLastPullJob((current) => {
              if (!current || current.jobId !== status.jobId) {
                return current;
              }

              return {
                ...current,
                ...status,
                datasetName: status.datasetName || current.datasetName,
              };
            });
          } catch {
            // Silent polling failure; next cycle will retry.
          }
        })();
      }, 3000);
    };

    eventSource.addEventListener('pull-status', (event) => {
      if (closed) {
        return;
      }

      try {
        const status = JSON.parse((event as MessageEvent).data) as PullDepositStatusResponse;
        setLastPullJob((current) => {
          if (!current || current.jobId !== status.jobId) {
            return current;
          }

          return {
            ...current,
            ...status,
            datasetName: status.datasetName || current.datasetName,
          };
        });

        if (terminalStatuses.has(String(status.status))) {
          eventSource.close();
        }
      } catch {
        startPollingFallback();
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      startPollingFallback();
    };

    return () => {
      closed = true;
      eventSource.close();
      if (pollInterval !== null) {
        window.clearInterval(pollInterval);
      }
    };
  }, [lastPullJob?.jobId, lastPullJob?.status]);

  async function load() {
    setLoading(true);

    try {
      const [catalog, userWorkspaces] = await Promise.all([
        listDepositDatasets({
          search: search || undefined,
          domain: domain === 'ALL' ? undefined : domain,
          favoritesOnly,
          page: 1,
          pageSize: 50,
        }),
        getMyWorkspaces(),
      ]);

      setItems(catalog.items);
      setWorkspaces(userWorkspaces);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to load central data deposit.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [domain, favoritesOnly]);

  const columns = useMemo(
    () =>
      createDepositColumns({
        onPreview: async (row) => {
          try {
            setSelectedDataset(row);
            setPreviewOpen(true);
            const data = await previewDepositDataset(row.id);
            setPreview(data);
          } catch (error) {
            toast.error((error as Error).message || 'Failed to load preview.');
            setPreviewOpen(false);
          }
        },
        onPull: (row) => {
          setSelectedDataset(row);
          setPullOpen(true);
        },
        onFavorite: async (row) => {
          try {
            await toggleFavoriteDataset(row.id, !row.isFavorite);
            await load();
          } catch (error) {
            toast.error((error as Error).message || 'Failed to update favorite.');
          }
        },
      }),
    [domain, favoritesOnly, items],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Central Data Deposit</h1>
          <p className="text-sm text-muted-foreground">
            Discover curated domain datasets, preview safely, and queue governed pulls into workspaces.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (onBackToDatasets) {
                onBackToDatasets();
                return;
              }

              router.push('/dashboard/datasets');
            }}
          >
            Back to Datasets
          </Button>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search datasets, tags, source..."
            className="w-70"
          />
          <Button variant="outline" onClick={() => void load()}>
            Search
          </Button>
          <Button variant={favoritesOnly ? 'default' : 'outline'} onClick={() => setFavoritesOnly((value) => !value)}>
            Favorites
          </Button>
        </div>
      </div>

      {lastPullJob ? (
        <Card className="rounded-2xl border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-2 p-4 text-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium">
                Pull job for {lastPullJob.datasetName} is {lastPullJob.status}
              </div>
              <div className="text-muted-foreground">
                Job ID: {lastPullJob.jobId}
                {lastPullJob.estimatedTime ? ` | ETA: ${lastPullJob.estimatedTime}` : ''}
                {lastPullJob.completedAt ? ` | Completed: ${new Date(lastPullJob.completedAt).toLocaleTimeString()}` : ''}
              </div>
              {lastPullJob.errorMessage ? (
                <div className="text-destructive">Error: {lastPullJob.errorMessage}</div>
              ) : null}
            </div>
            <Badge variant="secondary">{lastPullJob.status}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={domain === item ? 'default' : 'outline'}
            onClick={() => setDomain(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Datasets</div>
            <div className="mt-1 text-2xl font-semibold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Public</div>
            <div className="mt-1 text-2xl font-semibold">
              {items.filter((item) => item.accessibility === 'PUBLIC').length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Restricted</div>
            <div className="mt-1 text-2xl font-semibold">
              {items.filter((item) => item.accessibility === 'RESTRICTED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Favorites</div>
            <div className="mt-1 text-2xl font-semibold">{items.filter((item) => item.isFavorite).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'grid')}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="rounded-2xl border p-8 text-sm text-muted-foreground">Loading datasets...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-8 text-sm text-muted-foreground">No datasets matched your filters.</div>
      ) : view === 'table' ? (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="outline">{item.domain}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.accessibility}</Badge>
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border p-3">
                    <div className="text-muted-foreground">Records</div>
                    <div className="mt-1 font-medium">{item.recordCount ?? '-'}</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-muted-foreground">Updated</div>
                    <div className="mt-1 font-medium">{new Date(item.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setSelectedDataset(item);
                        setPreviewOpen(true);
                        const data = await previewDepositDataset(item.id);
                        setPreview(data);
                      } catch (error) {
                        toast.error((error as Error).message || 'Failed to load preview.');
                      }
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedDataset(item);
                      setPullOpen(true);
                    }}
                  >
                    Pull
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataDepositPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} preview={preview} />
      <DataDepositPullModal
        open={pullOpen}
        onOpenChange={setPullOpen}
        dataset={selectedDataset}
        workspaces={workspaces}
        onSubmit={async (payload) => {
          if (!selectedDataset) return;
          const response = await pullDepositDataset(selectedDataset.id, payload);
          setLastPullJob({ ...response, datasetName: selectedDataset.name });
          toast.success(response.message || 'Pull job queued successfully.');
          await load();
        }}
      />
    </div>
  );
}
