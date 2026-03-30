"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalysisJobStatusBadge } from "@/components/analysis/analysis-job-status-badge"
import type { AnalysisJobSummary } from "@/types/analysis"

export function AnalysisJobsTable({
  items,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  items: AnalysisJobSummary[]
  isLoading?: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const router = useRouter()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Job</TableHead>
              <TableHead>Dataset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length ? (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="min-w-[240px]">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.templateName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.dataset?.name ?? "—"}</TableCell>
                  <TableCell>
                    <AnalysisJobStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[180px] space-y-2">
                      <Progress value={item.progressPercent} />
                      <div className="text-xs text-muted-foreground">
                        {item.latestMessage || `${item.progressPercent}% complete`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(item.finishedAt || item.startedAt || item.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === "SUCCEEDED" && item.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/reports/${item.id}`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Report
                        </Button>
                      ) : null}
                      <Button size="sm" onClick={() => router.push(`/analysis/jobs/${item.id}`)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No analysis jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} · {total} total jobs
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
