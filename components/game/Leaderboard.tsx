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
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { LeaderboardRow } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

const columnHelper = createColumnHelper<LeaderboardRow & { sentence: string }>()

type Props = {
  localPlayerId: string | null
}

export function Leaderboard({ localPlayerId }: Props) {
  const players = useGameStore((s) => s.players)
  const currentRound = useGameStore((s) => s.currentRound)

  const [sortField, setSortField] = useQueryState('sort', { defaultValue: 'wpm' })
  const [sortDir, setSortDir] = useQueryState('dir', { defaultValue: 'desc' })

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortField, desc: sortDir === 'desc' },
  ])

  const sentence = currentRound?.sentence ?? ''

  const rows = useMemo(() => {
    const sorted = Array.from(players.values()).sort((a, b) => b.wpm - a.wpm)
    return sorted.map((p, i) => ({
      ...p,
      position: p.isFinished ? i + 1 : null,
      sentence,
    }))
  }, [players, sentence])

  const columns = useMemo(
    () => [
      columnHelper.accessor('position', {
        header: '#',
        cell: (info) => {
          const pos = info.getValue()
          if (pos === null) return <span style={{ color: 'var(--apex-text-dim)' }}>—</span>
          return (
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', color: 'var(--apex-gold)' }}>
              {pos <= 3 ? MEDALS[pos - 1] : pos}
            </span>
          )
        },
      }),
      columnHelper.accessor('username', {
        header: 'Player',
        cell: (info) => (
          <span className="font-medium" style={{ color: 'var(--apex-text)' }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('wpm', {
        header: 'WPM',
        cell: (info) => (
          <span
            className="font-display"
            style={{ fontSize: '1.25rem', color: 'var(--apex-gold)' }}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('accuracy', {
        header: 'Acc',
        cell: (info) => (
          <span style={{ color: 'var(--apex-text)' }}>
            {Math.round(info.getValue() * 100)}%
          </span>
        ),
      }),
      columnHelper.accessor('typedText', {
        header: 'Progress',
        enableSorting: false,
        cell: (info) => {
          const typed = info.getValue()
          const total = info.row.original.sentence.length
          const pct = total > 0 ? Math.round((typed.length / total) * 100) : 0
          const finished = info.row.original.isFinished
          return (
            <div className="flex items-center gap-2 min-w-[80px]">
              <div
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--apex-border-bright)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: finished ? 'var(--apex-green)' : 'var(--apex-gold)',
                  }}
                />
              </div>
              <span
                className="text-xs tabular-nums w-7 text-right"
                style={{ color: 'var(--apex-text-dim)' }}
              >
                {pct}%
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('isFinished', {
        header: 'Status',
        enableSorting: false,
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="apex-done">Done</Badge>
          ) : (
            <Badge variant="apex-live">
              <span className="inline-block w-1 h-1 rounded-full bg-current animate-pulse" />
              Live
            </Badge>
          ),
      }),
    ],
    []
  )

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
    <div className="animate-slide-up space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full" style={{ background: 'var(--apex-gold)' }} />
        <h2
          className="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          Live Standings
        </h2>
        <div
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(240,180,41,0.08)',
            color: 'var(--apex-gold)',
            border: '1px solid rgba(240,180,41,0.15)',
          }}
        >
          <span className="inline-block w-1 h-1 rounded-full bg-current animate-pulse" />
          {rows.length} {rows.length === 1 ? 'racer' : 'racers'}
        </div>
      </div>

      <Card
        className="gap-0 p-0 py-0 rounded-lg overflow-x-auto shadow-none border-0"
        style={{ border: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}
      >
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ borderBottom: '1px solid var(--apex-border)' }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold tracking-[0.15em] uppercase text-xs cursor-pointer select-none"
                    style={{ color: 'var(--apex-text-dim)' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span style={{ color: 'var(--apex-gold)', opacity: header.column.getIsSorted() ? 1 : 0.3 }}>
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => {
              const isLocal = row.original.playerId === localPlayerId
              return (
                <tr
                  key={row.id}
                  className="transition-colors duration-150"
                  style={{
                    borderBottom:
                      rowIdx < table.getRowModel().rows.length - 1
                        ? '1px solid var(--apex-border)'
                        : 'none',
                    background: isLocal
                      ? 'linear-gradient(90deg, rgba(240,180,41,0.06) 0%, rgba(240,180,41,0.02) 100%)'
                      : 'transparent',
                    borderLeft: isLocal ? '2px solid var(--apex-gold)' : '2px solid transparent',
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
