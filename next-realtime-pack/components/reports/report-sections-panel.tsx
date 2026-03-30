"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportSection } from "@/types/report"

export function ReportSectionsPanel({ sections }: { sections: ReportSection[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Report Narrative</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.length ? (
          sections.map((section) => (
            <section key={section.id} className="rounded-xl border p-4">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{section.body}</p>
            </section>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No narrative sections available.</p>
        )}
      </CardContent>
    </Card>
  )
}
