'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useRound } from '@/hooks/useRound'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import { useRealtimePlayers } from '@/hooks/useRealtimePlayers'
import { usePlayer } from '@/hooks/usePlayer'
import { useRoundResults } from '@/hooks/useRoundResults'
import { useTheme } from '@/hooks/useTheme'
import { useGameStore } from '@/lib/store/gameStore'
import { Countdown } from '@/components/game/Countdown'
import { TypingInput } from '@/components/game/TypingInput'
import { Leaderboard } from '@/components/game/Leaderboard'
import { JoinModal } from '@/components/game/JoinModal'
import { StatsCard } from '@/components/game/StatsCard'
import { GameLoadingSkeleton, LeaderboardSkeleton } from '@/components/game/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LeaderboardErrorBoundary } from '@/components/game/LeaderboardErrorBoundary'
import type { PlayerLiveState } from '@/types'

function GamePage() {
  const searchParams = useSearchParams()
  const isSpectator = searchParams.get('spectator') === '1'
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const { player, isLoading: playerLoading, isJoined, join, refreshPlayer } = usePlayer()
  const { round, secondsLeft, isLoading: roundLoading, error } = useRound()
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const localUsername = useGameStore((s) => s.localUsername)
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)
  const setInRoom = useGameStore((s) => s.setInRoom)

  const handleLeaveRoom = () => {
    setInRoom(false)
    router.push('/')
  }

  useEffect(() => {
    setInRoom(true)
  }, [setInRoom])

  useEffect(() => {
    setCurrentRound(round ?? null)
  }, [round, setCurrentRound])

  const totalSeconds = round
    ? Math.round((new Date(round.endsAt).getTime() - new Date(round.startedAt).getTime()) / 1000)
    : 60

  const isRoundActive = !!round && secondsLeft > 0

  const { typedText, wpm, accuracy, isFinished, charResults, handleChange } = useTypingEngine({
    sentence: round?.sentence ?? '',
    roundId: round?.id ?? '',
    isRoundActive: isRoundActive && !isSpectator,
  })

  const localPlayerState: PlayerLiveState | null =
    !isSpectator && localPlayerId && localUsername
      ? { playerId: localPlayerId, username: localUsername, typedText, wpm, accuracy, isFinished }
      : null

  useRealtimePlayers({ roundId: round?.id ?? null, localPlayerState })

  useRoundResults({
    roundId: round?.id ?? null,
    playerId: isSpectator ? null : localPlayerId,
    isRoundActive,
    wpm,
    accuracy,
    isFinished,
    onSaved: refreshPlayer,
  })

  const isLoading = playerLoading || roundLoading

  if (isLoading && !isJoined && !isSpectator) {
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
          className="px-6 py-4 rounded-lg text-sm font-mono"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: 'var(--apex-red)',
          }}
        >
          {error}
        </div>
      </main>
    )
  }

  return (
    <>
      {!isSpectator && <JoinModal open={!playerLoading && !isJoined} onJoin={join} />}

      <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="apex-ghost-sm"
              size="none"
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 tracking-[0.2em]"
              style={{ color: 'var(--apex-red)' }}
            >
              ✕ Leave Room
            </Button>
            <div className="w-px h-5" style={{ background: 'var(--apex-border-bright)' }} />
            <div>
              <p
                className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                style={{ color: isSpectator ? 'var(--apex-text-dim)' : 'var(--apex-gold)', opacity: 0.7 }}
              >
                {isSpectator ? 'Spectating' : 'Live Multiplayer'}
              </p>
              <span
                className="font-display leading-none"
                style={{ fontSize: '2rem', color: 'var(--apex-text)', letterSpacing: '0.12em' }}
              >
                TYPERACER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="apex-ghost-sm"
              size="none"
              onClick={toggleTheme}
              style={{ color: 'var(--apex-text-dim)' }}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            {player && !isSpectator && <StatsCard player={player} />}
          </div>
        </header>

        <div className="space-y-8">
          <Countdown secondsLeft={secondsLeft} totalSeconds={totalSeconds} isLoading={isLoading} />

          {round ? (
            <TypingInput
              sentence={round.sentence}
              typedText={typedText}
              charResults={charResults}
              wpm={wpm}
              accuracy={accuracy}
              isFinished={isFinished}
              isRoundActive={isRoundActive && isJoined && !isSpectator}
              onType={handleChange}
            />
          ) : (
            !isLoading && (isJoined || isSpectator) && (
              <Card
                className="flex-row items-center justify-center py-12 rounded-lg gap-0 shadow-none border-0"
                style={{ border: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}
              >
                <div className="text-center space-y-2">
                  <p className="apex-section-cap" style={{ color: 'var(--apex-gold)', opacity: 0.6 }}>
                    Standby
                  </p>
                  <p
                    className="text-sm tracking-wide font-mono"
                    style={{ color: 'var(--apex-text-dim)' }}
                  >
                    Next round starting soon…
                  </p>
                </div>
              </Card>
            )
          )}

          <LeaderboardErrorBoundary>
            <Suspense fallback={<LeaderboardSkeleton />}>
              <Leaderboard localPlayerId={localPlayerId} />
            </Suspense>
          </LeaderboardErrorBoundary>
        </div>
      </main>
    </>
  )
}

export default function GamePageWrapper() {
  return (
    <Suspense>
      <GamePage />
    </Suspense>
  )
}
