"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, PlayCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDatasetDetails } from "@/hooks/use-dataset-details"
import { DatasetOverviewCard } from "@/components/datasets/dataset-overview-card"
import { DatasetSchemaPreview } from "@/components/datasets/dataset-schema-preview"
import { DatasetArtifactsPanel } from "@/components/datasets/dataset-artifacts-panel"
import { DatasetLineageCard } from "@/components/datasets/dataset-lineage-card"
import { DatasetAnalysisDrawer } from "@/components/datasets/dataset-analysis-drawer"

export function DatasetDetailsPage({ datasetId }: { datasetId: string }) {
  const router = useRouter()
  const [analysisOpen, setAnalysisOpen] = React.useState(false)

  const { data, isLoading, isError, refetch, error } = useDatasetDetails(datasetId)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-lg font-semibold">Unable to load dataset details</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" className="w-fit px-0" onClick={() => router.push("/dashboard/datasets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Datasets
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              Deep view into schema, artifacts, lineage, and analysis controls.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"}/datasets/${datasetId}/download`,
                "_blank"
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={() => setAnalysisOpen(true)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Launch Analysis
          </Button>
        </div>
      </div>

      <DatasetOverviewCard dataset={data} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DatasetSchemaPreview columns={data.schemaPreview} />
          <DatasetArtifactsPanel datasetId={datasetId} />
        </div>

        <div className="space-y-6">
          <DatasetLineageCard versions={data.versions} />
        </div>
      </div>

      <DatasetAnalysisDrawer
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        datasetId={datasetId}
      />
    </div>
  )
}
