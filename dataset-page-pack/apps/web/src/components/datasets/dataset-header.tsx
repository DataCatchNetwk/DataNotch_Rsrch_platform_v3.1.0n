import { LayoutGrid, List, RefreshCcw, Database, Heart, FolderKanban, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DatasetViewMode } from './types'

export function DatasetHeader({
  stats,
  viewMode,
  onViewModeChange,
  onRefresh,
}: {
  stats: { total: number; favorites: number; workspaceLinked: number; ready: number }
  viewMode: DatasetViewMode
  onViewModeChange: (mode: DatasetViewMode) => void
  onRefresh: () => void
}) {
  const cards = [
    { label: 'Datasets', value: stats.total, icon: Database },
    { label: 'Favorites', value: stats.favorites, icon: Heart },
    { label: 'Workspace Linked', value: stats.workspaceLinked, icon: FolderKanban },
    { label: 'Ready', value: stats.ready, icon: ShieldCheck },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl border bg-background p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage library datasets, pull from the global deposit, build cohorts, launch analysis,
            and control lineage and governance from one page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => onViewModeChange('grid')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => onViewModeChange('table')}>
            <List className="mr-2 h-4 w-4" />
            Table
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="rounded-2xl">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
