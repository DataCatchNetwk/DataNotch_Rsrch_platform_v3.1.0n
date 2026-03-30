import { AnalysisJobDetailsPage } from "@/components/analysis/analysis-job-details-page"

export default async function AnalysisJobDetailsRoute({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  return <AnalysisJobDetailsPage jobId={jobId} />
}
