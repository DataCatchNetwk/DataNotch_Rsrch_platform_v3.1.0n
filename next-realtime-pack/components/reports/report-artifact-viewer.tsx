"use client"

import * as React from "react"
import { Download, Eye, FileText, ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportArtifact } from "@/types/report"

function isPreviewable(mimeType?: string | null) {
  if (!mimeType) return false
  return mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType.startsWith("text/")
}

export function ReportArtifactViewer({ artifacts }: { artifacts: ReportArtifact[] }) {
  const [selected, setSelected] = React.useState<ReportArtifact | null>(artifacts[0] ?? null)

  React.useEffect(() => {
    if (!selected && artifacts.length) setSelected(artifacts[0])
  }, [artifacts, selected])

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="rounded-2xl shadow-sm xl:col-span-1">
        <CardHeader>
          <CardTitle>Artifacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {artifacts.length ? (
            artifacts.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setSelected(artifact)}
                className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/40 ${
                  selected?.id === artifact.id ? "border-primary bg-muted/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {artifact.mimeType?.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="font-medium">{artifact.name}</span>
                  </div>
                  <Badge variant="outline">{artifact.kind}</Badge>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No artifacts available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Artifact Preview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!selected?.previewUrl}
              onClick={() => selected?.previewUrl && window.open(selected.previewUrl, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              size="sm"
              disabled={!selected?.downloadUrl}
              onClick={() => selected?.downloadUrl && window.open(selected.downloadUrl, "_blank")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selected ? (
            isPreviewable(selected.mimeType) && selected.previewUrl ? (
              selected.mimeType?.startsWith("image/") ? (
                <img
                  src={selected.previewUrl}
                  alt={selected.name}
                  className="max-h-[640px] w-full rounded-xl border object-contain"
                />
              ) : selected.mimeType === "application/pdf" ? (
                <iframe src={selected.previewUrl} className="h-[640px] w-full rounded-xl border" />
              ) : (
                <iframe src={selected.previewUrl} className="h-[640px] w-full rounded-xl border bg-white" />
              )
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                Preview is not available for this artifact type.
              </div>
            )
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Select an artifact to preview.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
