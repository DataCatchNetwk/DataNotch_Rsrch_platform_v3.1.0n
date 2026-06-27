import { api } from "@/lib/api/client"
import type {
  AnalysisJobDetails,
  AnalysisJobFilters,
  AnalysisJobsResponse,
} from "@/types/analysis"

function cleanParams(filters: AnalysisJobFilters) {
  const params: Record<string, string | number> = {}

  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== "ALL") params.status = filters.status
  if (filters.page) params.page = filters.page
  if (filters.pageSize) params.pageSize = filters.pageSize
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder

  return params
}

export async function fetchAnalysisJobs(
  filters: AnalysisJobFilters
): Promise<AnalysisJobsResponse> {
  const { data } = await api.get("/analysis/jobs", {
    params: cleanParams(filters),
  })

  return data
}

export async function fetchAnalysisJob(jobId: string): Promise<AnalysisJobDetails> {
  const { data } = await api.get(`/analysis/jobs/${jobId}`)
  return data
}

export async function cancelAnalysisJob(jobId: string) {
  const { data } = await api.post(`/analysis/jobs/${jobId}/cancel`)
  return data
}
