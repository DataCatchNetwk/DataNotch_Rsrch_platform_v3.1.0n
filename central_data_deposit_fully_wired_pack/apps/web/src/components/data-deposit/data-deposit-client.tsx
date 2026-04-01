"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  listDepositDatasets,
  previewDepositDataset,
  pullDepositDataset,
  toggleFavoriteDataset,
} from '@/lib/api/data-deposit'
import type {
  DepositDatasetSummary,
  DepositPreviewResponse,
} from '@/lib/types/data-deposit'
import { createDepositColumns } from './data-deposit-columns'
import { DataDepositPreviewModal } from './data-deposit-preview-modal'
import { DataDepositPullModal } from './data-deposit-pull-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const DOMAINS = ['ALL', 'HEALTH', 'SOCIAL', 'CLIMATE', 'ECONOMIC', 'DEMOGRAPHIC', 'EDUCATION', 'OTHER'] as const

export function DataDepositClient() {
  const [items, setItems] = useState<DepositDatasetSummary[]>([])
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState<string>('ALL')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<DepositPreviewResponse | null>(null)
  const [pullOpen, setPullOpen] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<DepositDatasetSummary | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await listDepositDatasets({
        search: search || undefined,
        domain: domain === 'ALL' ? undefined : domain,
        favoritesOnly,
        page: 1,
        pageSize: 50,
      })
      setItems(res.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [domain, favoritesOnly])

  const columns = useMemo(
    () =>
      createDepositColumns({
        onPreview: async (row) => {
          setSelectedDataset(row)
          setPreviewOpen(true)
          const data = await previewDepositDataset(row.id)
          setPreview(data)
        },
        onPull: (row) => {
          setSelectedDataset(row)
          setPullOpen(true)
        },
        onFavorite: async (row) => {
          await toggleFavoriteDataset(row.id, !row.isFavorite)
          await load()
        },
      }),
    [items],
  )

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets, tags, source..."
            className="w-[280px]"
          />
          <Button variant="outline" onClick={() => void load()}>Search</Button>
          <Button
            variant={favoritesOnly ? 'default' : 'outline'}
            onClick={() => setFavoritesOnly((v) => !v)}
          >
            Favorites
          </Button>
        </div>
      </div>

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
        <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Datasets</div><div className="mt-1 text-2xl font-semibold">{items.length}</div></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Public</div><div className="mt-1 text-2xl font-semibold">{items.filter((i) => i.accessibility === 'PUBLIC').length}</div></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Restricted</div><div className="mt-1 text-2xl font-semibold">{items.filter((i) => i.accessibility === 'RESTRICTED').length}</div></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Favorites</div><div className="mt-1 text-2xl font-semibold">{items.filter((i) => i.isFavorite).length}</div></CardContent></Card>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')}>
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
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border p-3"><div className="text-muted-foreground">Records</div><div className="mt-1 font-medium">{item.recordCount ?? '-'}</div></div>
                  <div className="rounded-xl border p-3"><div className="text-muted-foreground">Updated</div><div className="mt-1 font-medium">{new Date(item.updatedAt).toLocaleDateString()}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={async () => {
                    setSelectedDataset(item)
                    setPreviewOpen(true)
                    const data = await previewDepositDataset(item.id)
                    setPreview(data)
                  }}>Preview</Button>
                  <Button onClick={() => { setSelectedDataset(item); setPullOpen(true) }}>Pull</Button>
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
        onSubmit={async (payload) => {
          if (!selectedDataset) return
          await pullDepositDataset(selectedDataset.id, payload)
          await load()
        }}
      />
    </div>
  )
}
