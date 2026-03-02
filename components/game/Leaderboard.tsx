'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import type { LeaderboardRow } from '@/types'

const columnHelper = createColumnHelper<LeaderboardRow>()

const columns = [
  columnHelper.accessor('position', {
    header: '#',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor('username', {
    header: 'Player',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('wpm', {
    header: 'WPM',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('accuracy', {
    header: 'Accuracy',
    cell: (info) => `${Math.round(info.getValue() * 100)}%`,
  }),
  columnHelper.accessor('isFinished', {
    header: 'Status',
    cell: (info) => (info.getValue() ? 'Finished' : 'Typing...'),
    enableSorting: false,
  }),
]

type Props = {
  localPlayerId: string | null
}

export function Leaderboard({ localPlayerId }: Props) {
  const players = useGameStore((s) => s.players)

  const [sortField, setSortField] = useQueryState('sort', { defaultValue: 'wpm' })
  const [sortDir, setSortDir] = useQueryState('dir', { defaultValue: 'desc' })

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortField, desc: sortDir === 'desc' },
  ])

  const rows: LeaderboardRow[] = useMemo(() => {
    const sorted = Array.from(players.values()).sort((a, b) => b.wpm - a.wpm)
    return sorted.map((p, i) => ({
      ...p,
      position: p.isFinished ? i + 1 : null,
    }))
  }, [players])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      if (next[0]) {
        setSortField(next[0].id)
        setSortDir(next[0].desc ? 'desc' : 'asc')
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && ' ↑'}
                  {header.column.getIsSorted() === 'desc' && ' ↓'}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.original.playerId === localPlayerId
                  ? 'bg-blue-50 font-medium'
                  : 'bg-white hover:bg-slate-50'
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
