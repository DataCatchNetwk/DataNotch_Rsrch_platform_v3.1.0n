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
      <CardContent className="p-0">
        {columns.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No schema profile available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Column</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Nullable</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Unique</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Null %</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sample values</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column) => {
                  const nullPct = (column as DatasetColumnProfile & { nullPercent?: number }).nullPercent
                  return (
                    <tr key={column.name} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{column.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{column.type}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="outline">{column.nullable ? "Yes" : "No"}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {column.unique ? <Badge>Unique</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {nullPct != null ? (
                          <span className={nullPct > 20 ? "text-red-600 font-medium" : nullPct > 5 ? "text-yellow-600" : "text-muted-foreground"}>
                            {nullPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate">
                        {column.sampleValues?.slice(0, 4).join(", ") || "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
