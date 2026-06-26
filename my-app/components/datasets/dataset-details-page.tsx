"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Download, PlayCircle, RefreshCw, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDatasetDetails } from "@/hooks/use-dataset-details"
import { DatasetOverviewCard } from "@/components/datasets/dataset-overview-card"
import { DatasetSchemaPreview } from "@/components/datasets/dataset-schema-preview"
import { DatasetArtifactsPanel } from "@/components/datasets/dataset-artifacts-panel"
import { DatasetLineageCard } from "@/components/datasets/dataset-lineage-card"
import { DatasetAnalysisDrawer } from "@/components/datasets/dataset-analysis-drawer"
import { DatasetQualityCard } from "@/components/datasets/dataset-quality-card"
import { DatasetRowPreview } from "@/components/datasets/dataset-row-preview"
import { DatasetAuditTrail } from "@/components/datasets/dataset-audit-trail"
import { DatasetAccessInfoCard } from "@/components/datasets/dataset-access-info-card"

export function DatasetDetailsPage({ datasetId }: { datasetId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [analysisOpen, setAnalysisOpen] = React.useState(false)

  React.useEffect(() => {
    if (searchParams.get("analysis") === "1") {
      setAnalysisOpen(true)
    }
  }, [searchParams])

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
      {/* Header */}
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api"}/v1/datasets/deposit/${datasetId}/download`,
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

      {/* Overview */}
      <DatasetOverviewCard dataset={data} />

      {/* Tabbed detail area */}
      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="access">Access &amp; Licensing</TabsTrigger>
          <TabsTrigger value="audit">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema">
          <DatasetSchemaPreview columns={data.schemaPreview} />
        </TabsContent>

        <TabsContent value="preview">
          {data.previewRows && data.previewRows.length > 0 ? (
            <DatasetRowPreview
              columns={data.previewColumns ?? []}
              rows={data.previewRows}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No preview data available for this dataset.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quality">
          {data.quality ? (
            <DatasetQualityCard quality={data.quality} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Quality report not yet generated for this dataset.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="artifacts">
          <DatasetArtifactsPanel datasetId={datasetId} />
        </TabsContent>

        <TabsContent value="lineage">
          <DatasetLineageCard versions={data.versions} />
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access &amp; Licensing</CardTitle>
            </CardHeader>
            <CardContent>
              <DatasetAccessInfoCard dataset={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DatasetAuditTrail datasetId={datasetId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DatasetAnalysisDrawer
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        datasetId={datasetId}
      />
    </div>
  )
}

