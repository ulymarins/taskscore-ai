"use client"

import { type ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeltaBadge } from "@/components/task/delta-badge"
import { type TaskRow } from "@/types"

export function createColumns(domainSlug: string): ColumnDef<TaskRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-zinc-500 hover:text-zinc-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Task
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/${domainSlug}/${row.original.categorySlug}/${row.original.slug}`}
          className="font-medium text-zinc-200 underline-offset-4 hover:text-white hover:underline"
        >
          {row.getValue<string>("name")}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm text-zinc-500">{row.getValue<string>("category")}</span>
      ),
    },
    {
      accessorKey: "editorScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-zinc-500 hover:text-zinc-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Editor Score
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-zinc-300">
          {row.getValue<number>("editorScore")}<span className="text-zinc-600">/5</span>
        </span>
      ),
    },
    {
      accessorKey: "communityScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-zinc-500 hover:text-zinc-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Community Score
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.getValue<number | null>("communityScore")
        const count = row.original.voteCount
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-300">
              {score !== null ? (
                <>{score.toFixed(1)}<span className="text-zinc-600">/5</span></>
              ) : (
                <span className="text-zinc-700">—</span>
              )}
            </span>
            {count > 0 && (
              <span className="font-mono text-xs text-zinc-700">({count})</span>
            )}
          </div>
        )
      },
    },
    {
      id: "delta",
      header: "Delta",
      cell: ({ row }) => (
        <DeltaBadge
          editorScore={row.original.editorScore}
          communityScore={row.original.communityScore}
          voteCount={row.original.voteCount}
        />
      ),
    },
  ]
}
