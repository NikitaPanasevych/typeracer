'use client'

import { Suspense, useEffect } from 'react'
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
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)

  useEffect(() => {
    setCurrentRound(round ?? null)
  }, [round, setCurrentRound])

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
      <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
        <header className="mb-10 flex items-center gap-4">
          <div className="w-1 h-8 rounded-full" style={{ background: 'var(--apex-gold)' }} />
          <span
            className="font-display tracking-widest"
            style={{ fontSize: '2rem', color: 'var(--apex-text)', letterSpacing: '0.15em' }}
          >
            TYPERACER
          </span>
        </header>
        <GameLoadingSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div
          className="px-6 py-4 rounded-lg text-sm"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: 'var(--apex-red)',
            fontFamily: 'var(--font-space), monospace',
          }}
        >
          {error}
        </div>
      </main>
    )
  }

  return (
    <>
      <JoinModal open={!playerLoading && !isJoined} onJoin={join} />

      <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 rounded-full" style={{ background: 'var(--apex-gold)' }} />
            <div>
              <p
                className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                style={{ color: 'var(--apex-gold)', opacity: 0.7 }}
              >
                Live Multiplayer
              </p>
              <span
                className="font-display leading-none"
                style={{ fontSize: '2rem', color: 'var(--apex-text)', letterSpacing: '0.12em' }}
              >
                TYPERACER
              </span>
            </div>
          </div>

          {player && <StatsCard player={player} />}
        </header>

        <div className="space-y-8">
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
              <div
                className="flex items-center justify-center py-12 rounded-lg"
                style={{
                  border: '1px solid var(--apex-border)',
                  background: 'var(--apex-surface)',
                }}
              >
                <div className="text-center space-y-2">
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase"
                    style={{ color: 'var(--apex-gold)', opacity: 0.6 }}
                  >
                    Standby
                  </p>
                  <p
                    className="text-sm tracking-wide"
                    style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
                  >
                    Next round starting soon…
                  </p>
                </div>
              </div>
            )
          )}

          <Suspense>
            <Leaderboard localPlayerId={localPlayerId} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
