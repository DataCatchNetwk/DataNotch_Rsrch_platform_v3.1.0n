"use client"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowDownUp } from "lucide-react"
import type { DatasetFilters } from "@/types/dataset"

interface Props<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  page: number
  pageSize: number
  total: number
  filters: DatasetFilters
  onPageChange: (page: number) => void
  onSortChange: (sortBy: NonNullable<DatasetFilters["sortBy"]>) => void
}

function isSortable(id: string) {
  return ["name", "createdAt", "updatedAt", "sizeBytes", "status"].includes(id)
}

export function DatasetsTable<TData>({
  columns,
  data,
  isLoading,
  page,
  pageSize,
  total,
  filters,
  onPageChange,
  onSortChange,
}: Props<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const isHeaderSortable = isSortable(header.column.id)
                  const activeSort = filters.sortBy === header.column.id
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : isHeaderSortable ? (
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => onSortChange(header.column.id as NonNullable<DatasetFilters["sortBy"]>)}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowDownUp className={`ml-2 h-3.5 w-3.5 ${activeSort ? "text-foreground" : "text-muted-foreground"}`} />
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={columns.length} className="h-12 text-muted-foreground">
                    Loading datasets...
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  No datasets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} | {total} total records
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
