import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DatasetQueryState } from './types'

const sections = [
  { value: 'all', label: 'All Sections' },
  { value: 'library', label: 'Dataset Library' },
  { value: 'deposit', label: 'Data Deposit' },
  { value: 'workspace', label: 'Workspace Datasets' },
  { value: 'cohort', label: 'Cohort Builder' },
  { value: 'operations', label: 'Data Operations' },
  { value: 'analysis', label: 'Analysis Launcher' },
  { value: 'lineage', label: 'Versions & Lineage' },
  { value: 'access', label: 'Access & Governance' },
  { value: 'favorites', label: 'Favorites' },
]

export function DatasetFilters({
  query,
  onChange,
}: {
  query: DatasetQueryState
  onChange: (value: DatasetQueryState) => void
}) {
  return (
    <div className="rounded-3xl border bg-background p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query.search}
            onChange={(event) => onChange({ ...query, search: event.target.value })}
            placeholder="Search datasets, modalities, tags, owners..."
            className="pl-9"
          />
        </div>

        <div className="lg:col-span-2">
          <Select value={query.section} onValueChange={(value) => onChange({ ...query, section: value as DatasetQueryState['section'] })}>
            <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.value} value={section.value}>{section.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={query.visibility} onValueChange={(value) => onChange({ ...query, visibility: value as DatasetQueryState['visibility'] })}>
            <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="TEAM">Team</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="RESTRICTED">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={query.sortBy} onValueChange={(value) => onChange({ ...query, sortBy: value as DatasetQueryState['sortBy'] })}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
              <SelectItem value="createdAt">Recently Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="recordCount">Record Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 lg:col-span-2 lg:justify-end">
          <Button
            variant={query.favoritesOnly ? 'default' : 'outline'}
            className="w-full lg:w-auto"
            onClick={() => onChange({ ...query, favoritesOnly: !query.favoritesOnly })}
          >
            Favorites
          </Button>
          <Button
            variant="outline"
            className="w-full lg:w-auto"
            onClick={() =>
              onChange({
                search: '',
                section: 'all',
                visibility: 'all',
                workspaceId: 'all',
                tag: 'all',
                sortBy: 'updatedAt',
                favoritesOnly: false,
              })
            }
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
