"use client"

import { format } from "date-fns"
import { AlertTriangle, Download, FileBarChart, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDatasetArtifacts } from "@/hooks/use-dataset-artifacts"

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`
}

export function DatasetArtifactsPanel({ datasetId }: { datasetId: string }) {
  const { data, isLoading, isError } = useDatasetArtifacts(datasetId)

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Reports & Artifacts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load artifacts.</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FileBarChart className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No artifacts generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((artifact) => (
              <div
                key={artifact.id}
                className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{artifact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {artifact.kind} · {formatBytes(artifact.sizeBytes)} · {format(new Date(artifact.createdAt), "PPP p")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={artifact.status === "FAILED" ? "destructive" : "outline"}>{artifact.status}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!artifact.downloadUrl || artifact.status !== "READY"}
                    onClick={() => {
                      if (artifact.downloadUrl) {
                        window.open(artifact.downloadUrl, "_blank")
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
