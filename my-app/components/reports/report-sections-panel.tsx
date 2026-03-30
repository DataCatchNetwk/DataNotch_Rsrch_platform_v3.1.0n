import type { ReportSection } from "@/types/report"

export function ReportSectionsPanel({ sections }: { sections: ReportSection[] }) {
  return (
    <section className="space-y-3">
      {sections.map((section) => (
        <article key={section.id} className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{section.body}</p>
        </article>
      ))}
    </section>
  )
}
