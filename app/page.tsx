'use client'

import { useRound } from '@/hooks/useRound'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import { Countdown } from '@/components/game/Countdown'
import { TypingInput } from '@/components/game/TypingInput'

export default function HomePage() {
  const { round, secondsLeft, isLoading, error } = useRound()

  const isRoundActive = !!round && secondsLeft > 0

  const { typedText, wpm, accuracy, isFinished, charResults, handleChange } = useTypingEngine({
    sentence: round?.sentence ?? '',
    roundId: round?.id ?? '',
    isRoundActive,
  })

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">TypeRacer</h1>
      <Countdown secondsLeft={secondsLeft} isLoading={isLoading} />
      {round ? (
        <TypingInput
          sentence={round.sentence}
          typedText={typedText}
          charResults={charResults}
          wpm={wpm}
          accuracy={accuracy}
          isFinished={isFinished}
          isRoundActive={isRoundActive}
          onType={handleChange}
        />
      ) : (
        !isLoading && <p className="text-slate-500">No active round. Starting soon...</p>
      )}
    </main>
  )
}
