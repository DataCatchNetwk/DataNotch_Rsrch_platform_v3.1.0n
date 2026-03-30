"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DatasetColumnProfile } from "@/types/dataset-details"

export function DatasetSchemaPreview({
  columns,
}: {
  columns: DatasetColumnProfile[]
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Schema Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {columns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schema profile available yet.</p>
        ) : (
          <div className="space-y-3">
            {columns.map((column) => (
              <div
                key={column.name}
                className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="font-medium">{column.name}</p>
                  <p className="text-sm text-muted-foreground">{column.type}</p>
                  {column.sampleValues?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sample: {column.sampleValues.join(", ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{column.nullable ? "Nullable" : "Required"}</Badge>
                  {column.unique ? <Badge>Unique</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
