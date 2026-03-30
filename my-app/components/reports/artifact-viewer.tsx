"use client"

import { Download, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ReportArtifact } from "@/types/report"

export function ArtifactViewer({ artifacts }: { artifacts: ReportArtifact[] }) {
  if (!artifacts.length) {
    return (
      <section className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Artifacts</h3>
        <p className="mt-2 text-sm text-muted-foreground">No artifacts available.</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border">
      <header className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Artifacts</h3>
      </header>
      <div className="divide-y">
        {artifacts.map((artifact) => (
          <article key={artifact.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{artifact.name}</p>
              <p className="text-xs text-muted-foreground">
                {artifact.kind} • {(artifact.sizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex items-center gap-2">
              {artifact.previewUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={artifact.previewUrl} target="_blank" rel="noreferrer">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Preview
                  </a>
                </Button>
              ) : null}
              {artifact.downloadUrl ? (
                <Button asChild size="sm">
                  <a href={artifact.downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
