'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlayer } from '@/hooks/usePlayer'
import { useGameStore } from '@/lib/store/gameStore'
import { useTheme } from '@/hooks/useTheme'
import { JoinModal } from '@/components/game/JoinModal'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { player, isLoading, isJoined, join, logout } = usePlayer()
  const setInRoom = useGameStore((s) => s.setInRoom)
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [showJoinModal, setShowJoinModal] = useState(false)

  const handleEnterGame = () => {
    if (!isJoined) {
      setShowJoinModal(true)
      return
    }
    setInRoom(true)
    router.push('/game')
  }

  const handleJoin = async (username: string, password: string, mode: 'signup' | 'signin') => {
    const result = await join(username, password, mode)
    if (!result.error) {
      setShowJoinModal(false)
      setInRoom(true)
      router.push('/game')
    }
    return result
  }

  const handleSpectate = () => {
    router.push('/game?spectator=1')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div
          className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--apex-border)', borderTopColor: 'var(--apex-gold)' }}
        />
      </main>
    )
  }

  return (
    <>
      <JoinModal open={showJoinModal} onJoin={handleJoin} onClose={() => setShowJoinModal(false)} />

      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <Button
          variant="apex-ghost-sm"
          size="none"
          onClick={toggleTheme}
          className="fixed top-5 right-5 transition-opacity"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>


        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: 'var(--apex-border-bright)' }} />
            <span
              className="text-[10px] font-semibold tracking-[0.4em] uppercase font-mono"
              style={{ color: 'var(--apex-gold)', opacity: 0.8 }}
            >
              Competitive Typing
            </span>
            <div className="h-px w-12" style={{ background: 'var(--apex-border-bright)' }} />
          </div>

          <h1
            className="font-display leading-none"
            style={{
              fontSize: 'clamp(4rem, 14vw, 9rem)',
              color: 'var(--apex-text)',
              letterSpacing: '0.06em',
            }}
          >
            TYPERACER
          </h1>

          <p
            className="mt-3 text-xs tracking-[0.25em] uppercase font-mono"
            style={{ color: 'var(--apex-text-dim)' }}
          >
            Real-time multiplayer · Live rankings
          </p>
        </div>

        {isJoined && player && (
          <div
            className="w-full max-w-sm mb-8 rounded-xl overflow-hidden animate-fade-in"
            style={{ border: '1px solid var(--apex-border)' }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'var(--apex-surface-2)', borderBottom: '1px solid var(--apex-border)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--apex-green)' }}
                />
                <span
                  className="text-xs font-semibold tracking-[0.15em] uppercase font-mono"
                  style={{ color: 'var(--apex-text-dim)' }}
                >
                  {player.username}
                </span>
              </div>
              <Button
                variant="apex-ghost-sm"
                size="none"
                onClick={logout}
                style={{ color: 'var(--apex-text-dim)' }}
              >
                Sign Out
              </Button>
            </div>

            <div
              className="grid grid-cols-3 divide-x"
              style={{
                background: 'var(--apex-surface)',
                borderColor: 'var(--apex-border)',
                '--tw-divide-opacity': '1',
              } as React.CSSProperties}
            >
              <div className="flex flex-col items-center py-5 px-3" style={{ borderRight: '1px solid var(--apex-border)' }}>
                <span
                  className="font-display leading-none"
                  style={{ fontSize: '2.25rem', color: 'var(--apex-text)' }}
                >
                  {player.totalRaces}
                </span>
                <span className="apex-stat-label mt-1.5">Races</span>
              </div>

              <div className="flex flex-col items-center py-5 px-3" style={{ borderRight: '1px solid var(--apex-border)' }}>
                <span
                  className="font-display leading-none"
                  style={{ fontSize: '2.25rem', color: 'var(--apex-gold)' }}
                >
                  {player.bestWpm}
                </span>
                <span className="apex-stat-label mt-1.5">Best WPM</span>
              </div>

              <div className="flex flex-col items-center py-5 px-3">
                <span
                  className="font-display leading-none"
                  style={{ fontSize: '2.25rem', color: 'var(--apex-text)' }}
                >
                  {Math.round(player.avgAccuracy * 100)}%
                </span>
                <span className="apex-stat-label mt-1.5">Avg Acc</span>
              </div>
            </div>
          </div>
        )}

        <div
          className="w-full max-w-sm flex flex-col gap-3 animate-slide-up"
          style={{ animationDelay: '0.08s' }}
        >
          <Button variant="apex-primary" size="action" onClick={handleEnterGame}>
            <span>Enter Game Room</span>
            <span>▶</span>
          </Button>

          <Button variant="apex-ghost" size="action" onClick={handleSpectate}>
            <span>Watch as Spectator</span>
            <span style={{ opacity: 0.5 }}>◉</span>
          </Button>

          {isJoined && player && (
            <Button variant="apex-muted" size="action" asChild>
              <Link href="/history">
                <span>Race History</span>
                <span style={{ opacity: 0.5 }}>↗</span>
              </Link>
            </Button>
          )}
        </div>
      </main>
    </>
  )
}
