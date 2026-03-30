import { ReportDetailsPage } from "@/components/reports/report-details-page"

export default async function ReportDetailsRoute({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  return <ReportDetailsPage reportId={reportId} />
}
