'use client'

type Props = {
  secondsLeft: number
  totalSeconds: number
  isLoading: boolean
}

export function Countdown({ secondsLeft, totalSeconds, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--apex-border-bright)' }} />
        <div className="h-16 w-36 rounded animate-pulse" style={{ background: 'var(--apex-border-bright)' }} />
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isUrgent = secondsLeft <= 10 && secondsLeft > 0
  const isDead = secondsLeft === 0

  const progress = totalSeconds > 0 ? Math.min(100, (secondsLeft / totalSeconds) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="apex-section-cap" style={{ color: 'var(--apex-text-dim)' }}>
        Round Time
      </p>

      <div
        className={`font-display tabular-nums leading-none select-none transition-colors duration-300 ${
          isUrgent ? 'animate-red-pulse' : ''
        }`}
        style={{
          fontSize: '5.5rem',
          color: isDead ? 'var(--apex-text-dim)' : isUrgent ? 'var(--apex-red)' : 'var(--apex-gold)',
          textShadow: isUrgent
            ? '0 0 30px rgba(248,113,113,0.5)'
            : isDead
            ? 'none'
            : '0 0 20px rgba(240,180,41,0.35)',
        }}
      >
        {formatted}
      </div>

      <div
        className="w-40 h-0.5 rounded-full overflow-hidden"
        style={{ background: 'var(--apex-border-bright)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            background: isUrgent ? 'var(--apex-red)' : 'var(--apex-gold)',
            boxShadow: isUrgent
              ? '0 0 8px rgba(248,113,113,0.6)'
              : '0 0 8px rgba(240,180,41,0.5)',
          }}
        />
      </div>
    </div>
  )
}
