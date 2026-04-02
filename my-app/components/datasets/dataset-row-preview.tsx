"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, TableProperties } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  columns: string[]
  rows: Array<Record<string, unknown>>
}

export function DatasetRowPreview({ columns, rows }: Props) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, 5)

  if (!columns.length || !rows.length) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableProperties className="h-4 w-4" />
            Row Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No preview data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TableProperties className="h-4 w-4" />
          Row Preview
          <span className="text-sm font-normal text-muted-foreground">({rows.length} rows)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 whitespace-nowrap max-w-[200px] truncate">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 5 ? (
          <div className="flex justify-center border-t p-3">
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} className="gap-2">
              {expanded ? <><ChevronUp className="h-4 w-4" />Show less</> : <><ChevronDown className="h-4 w-4" />Show all {rows.length} rows</>}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
