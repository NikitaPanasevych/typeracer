import type { Player } from '@/types'

export function StatsCard({ player }: { player: Player }) {
  return (
    <div
      className="flex items-center gap-px rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}
    >
      <div
        className="px-3 py-2 flex flex-col items-center min-w-[56px]"
        style={{ borderRight: '1px solid var(--apex-border)' }}
      >
        <span
          className="font-display leading-none"
          style={{ fontSize: '1.5rem', color: 'var(--apex-text)' }}
        >
          {player.totalRaces}
        </span>
        <span
          className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          Races
        </span>
      </div>

      <div
        className="px-3 py-2 flex flex-col items-center min-w-[56px]"
        style={{ borderRight: '1px solid var(--apex-border)' }}
      >
        <span
          className="font-display leading-none"
          style={{ fontSize: '1.5rem', color: 'var(--apex-gold)' }}
        >
          {player.bestWpm}
        </span>
        <span
          className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          Best
        </span>
      </div>

      <div className="px-3 py-2 flex flex-col items-center min-w-[56px]">
        <span
          className="font-display leading-none"
          style={{ fontSize: '1.5rem', color: 'var(--apex-text)' }}
        >
          {Math.round(player.avgAccuracy * 100)}%
        </span>
        <span
          className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          Avg Acc
        </span>
      </div>

      <div
        className="px-3 py-2 flex flex-col justify-center min-w-[80px]"
        style={{ borderLeft: '1px solid var(--apex-border)' }}
      >
        <div
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--apex-green)' }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Online
        </div>
        <p
          className="text-xs mt-0.5 truncate max-w-[72px]"
          style={{ color: 'var(--apex-text)', fontFamily: 'var(--font-space), monospace' }}
        >
          {player.username}
        </p>
      </div>
    </div>
  )
}
