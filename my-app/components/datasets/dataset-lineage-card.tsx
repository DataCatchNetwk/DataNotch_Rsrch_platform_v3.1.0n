"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DatasetVersionInfo } from "@/types/dataset-details"

export function DatasetLineageCard({
  versions,
}: {
  versions: DatasetVersionInfo[]
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Version Lineage</CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No version history found.</p>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <div key={version.version} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    v{version.version} · {version.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(version.createdAt), "PPP p")}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Created by {version.createdBy || "System"}</p>
                {version.notes ? <p className="mt-2 text-sm">{version.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
