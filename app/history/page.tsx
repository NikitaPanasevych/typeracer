import Link from 'next/link'
import { getHistoricalRounds } from '@/lib/db/results'
import type { HistoricalRound } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']
const PER_PAGE = 8

function RoundCard({ round, index }: { round: HistoricalRound; index: number }) {
  const date = new Date(round.startedAt)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="rounded-lg overflow-hidden animate-fade-in"
      style={{
        border: '1px solid var(--apex-border)',
        background: 'var(--apex-surface)',
        animationDelay: `${index * 0.04}s`,
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between gap-4"
        style={{ background: 'var(--apex-surface-2)', borderBottom: '1px solid var(--apex-border)' }}
      >
        <p
          className="text-xs leading-relaxed flex-1 truncate"
          style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
        >
          {round.sentence}
        </p>
        <span
          className="text-[10px] font-semibold tracking-[0.15em] uppercase shrink-0"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          {dateStr} · {timeStr}
        </span>
      </div>

      {round.results.length === 0 ? (
        <p
          className="px-5 py-4 text-xs tracking-wider uppercase"
          style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
        >
          No results recorded
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--apex-border)' }}>
          {round.results.slice(0, 5).map((r, i) => (
            <div key={r.playerId} className="px-5 py-3 flex items-center gap-4">
              <span
                className="w-6 font-display leading-none text-center shrink-0"
                style={{ fontSize: '1.1rem', color: 'var(--apex-gold)' }}
              >
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <span
                className="flex-1 text-sm font-medium truncate"
                style={{ color: 'var(--apex-text)', fontFamily: 'var(--font-space), monospace' }}
              >
                {r.username}
              </span>
              <span
                className="font-display leading-none shrink-0"
                style={{ fontSize: '1.25rem', color: 'var(--apex-gold)' }}
              >
                {r.wpm}
              </span>
              <span
                className="text-xs shrink-0"
                style={{ color: 'var(--apex-text-dim)', minWidth: '3rem', textAlign: 'right' }}
              >
                {Math.round(r.accuracy * 100)}%
              </span>
              <span
                className="text-[10px] font-semibold tracking-wider uppercase shrink-0 px-2 py-0.5 rounded-full"
                style={
                  r.finishedTyping
                    ? { background: 'rgba(52,211,153,0.1)', color: 'var(--apex-green)', border: '1px solid rgba(52,211,153,0.25)' }
                    : { background: 'rgba(240,180,41,0.08)', color: 'var(--apex-gold)', border: '1px solid rgba(240,180,41,0.2)' }
                }
              >
                {r.finishedTyping ? 'Done' : 'DNF'}
              </span>
            </div>
          ))}
          {round.results.length > 5 && (
            <p
              className="px-5 py-2 text-[10px] tracking-widest uppercase"
              style={{ color: 'var(--apex-text-dim)' }}
            >
              +{round.results.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const { rounds, total } = await getHistoricalRounds(page, PER_PAGE)
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[11px] font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
            style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
          >
            ← Lobby
          </Link>
          <div className="w-px h-5" style={{ background: 'var(--apex-border-bright)' }} />
          <div>
            <p
              className="text-[10px] font-semibold tracking-[0.3em] uppercase"
              style={{ color: 'var(--apex-gold)', opacity: 0.7 }}
            >
              Race History
            </p>
            <span
              className="font-display leading-none"
              style={{ fontSize: '2rem', color: 'var(--apex-text)', letterSpacing: '0.12em' }}
            >
              TYPERACER
            </span>
          </div>
        </div>

        <span
          className="text-xs font-semibold tracking-[0.15em] uppercase"
          style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
        >
          {total} rounds
        </span>
      </header>

      {rounds.length === 0 ? (
        <div
          className="flex items-center justify-center py-20 rounded-lg"
          style={{ border: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}
        >
          <p
            className="text-sm tracking-[0.2em] uppercase"
            style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
          >
            No completed rounds yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round, i) => (
            <RoundCard key={round.roundId} round={round} index={i} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/history?page=${page - 1}`}
              className="px-4 py-2 rounded text-xs font-semibold tracking-[0.15em] uppercase transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--apex-border-bright)',
                color: 'var(--apex-text)',
                fontFamily: 'var(--font-space), monospace',
              }}
            >
              ← Prev
            </Link>
          )}
          <span
            className="px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
          >
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/history?page=${page + 1}`}
              className="px-4 py-2 rounded text-xs font-semibold tracking-[0.15em] uppercase transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--apex-border-bright)',
                color: 'var(--apex-text)',
                fontFamily: 'var(--font-space), monospace',
              }}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
