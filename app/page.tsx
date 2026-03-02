'use client'

import { Suspense } from 'react'
import { useRound } from '@/hooks/useRound'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import { useRealtimePlayers } from '@/hooks/useRealtimePlayers'
import { usePlayer } from '@/hooks/usePlayer'
import { useRoundResults } from '@/hooks/useRoundResults'
import { useGameStore } from '@/lib/store/gameStore'
import { Countdown } from '@/components/game/Countdown'
import { TypingInput } from '@/components/game/TypingInput'
import { Leaderboard } from '@/components/game/Leaderboard'
import { JoinModal } from '@/components/game/JoinModal'
import { StatsCard } from '@/components/game/StatsCard'
import { GameLoadingSkeleton } from '@/components/game/LoadingSkeleton'
import type { PlayerLiveState } from '@/types'

export default function HomePage() {
  const { player, isLoading: playerLoading, isJoined, join } = usePlayer()
  const { round, secondsLeft, isLoading: roundLoading, error } = useRound()
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const localUsername = useGameStore((s) => s.localUsername)

  const isRoundActive = !!round && secondsLeft > 0

  const { typedText, wpm, accuracy, isFinished, charResults, handleChange } = useTypingEngine({
    sentence: round?.sentence ?? '',
    roundId: round?.id ?? '',
    isRoundActive,
  })

  const localPlayerState: PlayerLiveState | null =
    localPlayerId && localUsername
      ? { playerId: localPlayerId, username: localUsername, typedText, wpm, accuracy, isFinished }
      : null

  useRealtimePlayers({ roundId: round?.id ?? null, localPlayerState })

  useRoundResults({
    roundId: round?.id ?? null,
    playerId: localPlayerId,
    isRoundActive,
    wpm,
    accuracy,
    isFinished,
  })

  const isLoading = playerLoading || roundLoading

  if (isLoading && !isJoined) {
    return (
      <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">TypeRacer</h1>
        <GameLoadingSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    )
  }

  return (
    <>
      <JoinModal open={!playerLoading && !isJoined} onJoin={join} />
      <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">TypeRacer</h1>
          {player && <StatsCard player={player} />}
        </div>
        <Countdown secondsLeft={secondsLeft} isLoading={isLoading} />
        {round ? (
          <TypingInput
            sentence={round.sentence}
            typedText={typedText}
            charResults={charResults}
            wpm={wpm}
            accuracy={accuracy}
            isFinished={isFinished}
            isRoundActive={isRoundActive && isJoined}
            onType={handleChange}
          />
        ) : (
          !isLoading && isJoined && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-lg">Next round starting soon...</p>
            </div>
          )
        )}
        <Suspense>
          <Leaderboard localPlayerId={localPlayerId} />
        </Suspense>
      </main>
    </>
  )
}
