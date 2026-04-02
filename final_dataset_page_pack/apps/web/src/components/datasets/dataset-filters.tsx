"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, LayoutGrid, TableProperties, Star } from "lucide-react"

export function DatasetFilters({
  query,
  setQuery,
  domain,
  setDomain,
  accessLevel,
  setAccessLevel,
  favoritesOnly,
  setFavoritesOnly,
  view,
  setView,
  onRefresh,
}: {
  query: string
  setQuery: (v: string) => void
  domain: string
  setDomain: (v: string) => void
  accessLevel: string
  setAccessLevel: (v: string) => void
  favoritesOnly: boolean
  setFavoritesOnly: (v: boolean) => void
  view: "grid" | "table"
  setView: (v: "grid" | "table") => void
  onRefresh: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
          <p className="text-sm text-muted-foreground">
            Browse, preview, favorite, and pull research-ready datasets into workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={favoritesOnly ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Star className="mr-2 h-4 w-4" />
            Favorites
          </Button>

          <Button
            type="button"
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={view === "table" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setView("table")}
          >
            <TableProperties className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, description, source, tags..."
            className="pl-9"
          />
        </div>

        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All domains</SelectItem>
            <SelectItem value="HEALTH">Health</SelectItem>
            <SelectItem value="SOCIAL">Social</SelectItem>
            <SelectItem value="CLIMATE">Climate</SelectItem>
            <SelectItem value="GENOMICS">Genomics</SelectItem>
            <SelectItem value="WEARABLES">Wearables</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accessLevel} onValueChange={setAccessLevel}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Access level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All access</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="INTERNAL">Internal</SelectItem>
            <SelectItem value="RESTRICTED">Restricted</SelectItem>
            <SelectItem value="APPROVAL_REQUIRED">Approval required</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" className="rounded-xl" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
