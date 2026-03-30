"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, FolderSearch, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatasetStatsCards } from "@/components/datasets/dataset-stats-cards"
import { DatasetFiltersBar } from "@/components/datasets/dataset-filters"
import { DatasetUploadDialog } from "@/components/datasets/dataset-upload-dialog"
import { DatasetsTable } from "@/components/datasets/datasets-table"
import { getDatasetColumns } from "@/components/datasets/dataset-columns"
import { useDatasets } from "@/hooks/use-datasets"
import { useDeleteDataset } from "@/hooks/use-upload-dataset"
import type { DatasetFilters, DatasetItem } from "@/types/dataset"

const defaultFilters: DatasetFilters = {
  search: "",
  visibility: "ALL",
  status: "ALL",
  fileKind: "ALL",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
}

export function DatasetsPageView() {
  const router = useRouter()
  const [filters, setFilters] = React.useState<DatasetFilters>(defaultFilters)
  const [uploadOpen, setUploadOpen] = React.useState(false)

  const { data, isLoading, isError, error, refetch } = useDatasets(filters)
  const deleteMutation = useDeleteDataset()

  const columns = React.useMemo(
    () =>
      getDatasetColumns({
        onView: (row) => router.push(`/dashboard/datasets/${row.id}`),
        onAnalyze: (row) => router.push(`/dashboard/reports?datasetId=${row.id}`),
        onDownload: (row) => {
          window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"}/datasets/${row.id}/download`, "_blank")
        },
        onDelete: async (row) => {
          const confirmed = window.confirm(`Delete "${row.name}"? This action cannot be undone.`)
          if (!confirmed) return
          try {
            await deleteMutation.mutateAsync(row.id)
            toast.success("Dataset deleted successfully.")
          } catch (e) {
            toast.error((e as Error).message)
          }
        },
      }),
    [deleteMutation, router]
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const page = data?.page ?? filters.page ?? 1
  const pageSize = data?.pageSize ?? filters.pageSize ?? 10

  const showEmpty = !isLoading && !isError && items.length === 0

  function handleSortChange(sortBy: NonNullable<DatasetFilters["sortBy"]>) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
    }))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Datasets</h1>
          <p className="text-sm text-muted-foreground">
            Upload, organize, inspect, and launch analysis workflows on research datasets.
          </p>
        </div>

        <Button size="lg" className="gap-2 rounded-xl" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload Dataset
        </Button>
      </div>

      <DatasetStatsCards />

      <DatasetFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="rounded-full border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Unable to load datasets</h3>
              <p className="text-sm text-muted-foreground">
                {(error as Error)?.message || "Something went wrong while loading datasets."}
              </p>
            </div>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : showEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-14 text-center">
            <div className="rounded-full border bg-muted/40 p-4">
              <FolderSearch className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No datasets found</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                No records matched your current filters. Try adjusting the search,
                resetting filters, or uploading a new dataset.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
                Reset filters
              </Button>
              <Button onClick={() => setUploadOpen(true)}>Upload dataset</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DatasetsTable<DatasetItem>
          columns={columns}
          data={items}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          filters={filters}
          onSortChange={handleSortChange}
          onPageChange={(nextPage) =>
            setFilters((prev) => ({
              ...prev,
              page: nextPage,
            }))
          }
        />
      )}

      <DatasetUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}
