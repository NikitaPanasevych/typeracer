export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="h-10 rounded animate-pulse" style={{ background: 'var(--apex-surface)' }} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-12 rounded animate-pulse"
          style={{ background: 'var(--apex-surface)', opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  )
}

export function GameLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-3 w-24 rounded animate-pulse"
          style={{ background: 'var(--apex-border-bright)' }}
        />
        <div
          className="h-20 w-44 rounded animate-pulse"
          style={{ background: 'var(--apex-border-bright)' }}
        />
        <div
          className="h-0.5 w-36 rounded-full animate-pulse"
          style={{ background: 'var(--apex-border-bright)' }}
        />
      </div>

      <div
        className="h-36 rounded-lg animate-pulse"
        style={{ background: 'var(--apex-surface)' }}
      />

      <div className="space-y-2">
        <div
          className="h-10 rounded animate-pulse"
          style={{ background: 'var(--apex-surface)' }}
        />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded animate-pulse"
            style={{ background: 'var(--apex-surface)', opacity: 1 - i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}
