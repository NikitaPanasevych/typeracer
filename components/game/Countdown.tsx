'use client'

type Props = {
  secondsLeft: number
  isLoading: boolean
}

export function Countdown({ secondsLeft, isLoading }: Props) {
  if (isLoading) {
    return <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isUrgent = secondsLeft <= 10

  return (
    <div className="text-center">
      <p className="text-sm text-slate-500 mb-1">Time remaining</p>
      <span
        className={`text-4xl font-mono font-bold tabular-nums ${
          isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-800'
        }`}
      >
        {formatted}
      </span>
    </div>
  )
}
