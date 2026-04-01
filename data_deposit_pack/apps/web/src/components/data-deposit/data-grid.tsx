"use client"

import { useEffect, useState } from 'react'
import { favoriteDepositDataset, listDepositDatasets, pullDatasetToWorkspace, unfavoriteDepositDataset } from '@/lib/api/data-deposit'
import type { DepositDataset } from '@/lib/types/data-deposit'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataPreviewModal } from './data-preview-modal'

const domains = ['ALL','HEALTH','SOCIAL','CLIMATE','EDUCATION','ECONOMIC','DEMOGRAPHIC','ENVIRONMENT','MOBILITY','GENOMICS','OTHER'] as const

export function DataGrid() {
  const [datasets, setDatasets] = useState<DepositDataset[]>([])
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState<string>('ALL')
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await listDepositDatasets({ search, domain })
      setDatasets(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleFavorite(dataset: DepositDataset) {
    if (dataset.favorites?.length) await unfavoriteDepositDataset(dataset.id)
    else await favoriteDepositDataset(dataset.id)
    await load()
  }

  async function pull(dataset: DepositDataset) {
    await pullDatasetToWorkspace(dataset.id, {
      workspaceId: 'replace-with-real-workspace-id',
      requestedColumns: [],
      filterJson: {},
    })
    alert(`Pull requested for ${dataset.name}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search datasets, descriptions, tags..." />
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="md:w-[220px]"><SelectValue placeholder="Domain" /></SelectTrigger>
          <SelectContent>
            {domains.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={load}>Search</Button>
      </div>

      {loading ? <div>Loading datasets...</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-3 text-lg">
                <span>{dataset.name}</span>
                <Button variant="ghost" size="sm" onClick={() => toggleFavorite(dataset)}>
                  {dataset.favorites?.length ? '★' : '☆'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{dataset.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-2">Domain: {dataset.domain}</div>
                <div className="rounded-xl border p-2">Access: {dataset.accessibility}</div>
                <div className="rounded-xl border p-2">Rows: {dataset.rowCount ?? '-'}</div>
                <div className="rounded-xl border p-2">Cols: {dataset.columnCount ?? '-'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(dataset.tags ?? []).slice(0, 5).map((tag) => (
                  <span key={tag} className="rounded-full border px-2 py-1 text-xs">{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setSelectedPreviewId(dataset.id); setPreviewOpen(true) }}>Preview</Button>
                <Button onClick={() => pull(dataset)}>Pull to Workspace</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataPreviewModal datasetId={selectedPreviewId} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}
