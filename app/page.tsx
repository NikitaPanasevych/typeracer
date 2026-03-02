'use client'

import { useRound } from '@/hooks/useRound'
import { Countdown } from '@/components/game/Countdown'

export default function HomePage() {
  const { round, secondsLeft, isLoading, error } = useRound()

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">TypeRacer</h1>
      <Countdown secondsLeft={secondsLeft} isLoading={isLoading} />
      {round && (
        <p className="mt-8 text-xl text-slate-700">{round.sentence}</p>
      )}
    </main>
  )
}
