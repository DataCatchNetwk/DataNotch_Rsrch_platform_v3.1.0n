"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchReportDetails } from "@/lib/api/reports"

export function useReportDetails(reportId?: string) {
  return useQuery({
    queryKey: ["report-details", reportId],
    queryFn: () => fetchReportDetails(reportId as string),
    enabled: Boolean(reportId),
  })
}
