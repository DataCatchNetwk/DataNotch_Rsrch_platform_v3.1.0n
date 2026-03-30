import { api } from "@/lib/api/client"
import type { ReportDetails } from "@/types/report"

export async function fetchReportDetails(reportId: string): Promise<ReportDetails> {
  const { data } = await api.get(`/reports/${reportId}`)
  return data
}
