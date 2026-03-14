'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlayer } from '@/hooks/usePlayer'
import { useGameStore } from '@/lib/store/gameStore'
import { useTheme } from '@/hooks/useTheme'
import { JoinModal } from '@/components/game/JoinModal'

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

  const handleJoin = async (username: string) => {
    const result = await join(username)
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
      <JoinModal open={showJoinModal} onJoin={handleJoin} />

      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <button
          onClick={toggleTheme}
          className="fixed top-5 right-5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-opacity hover:opacity-60"
          style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>


        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: 'var(--apex-border-bright)' }} />
            <span
              className="text-[10px] font-semibold tracking-[0.4em] uppercase"
              style={{ color: 'var(--apex-gold)', opacity: 0.8, fontFamily: 'var(--font-space), monospace' }}
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
            className="mt-3 text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
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
                  className="text-xs font-semibold tracking-[0.15em] uppercase"
                  style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
                >
                  {player.username}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-[10px] font-semibold tracking-[0.15em] uppercase transition-opacity hover:opacity-60"
                style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
              >
                Sign Out
              </button>
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
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase mt-1.5"
                  style={{ color: 'var(--apex-text-dim)' }}
                >
                  Races
                </span>
              </div>

              <div className="flex flex-col items-center py-5 px-3" style={{ borderRight: '1px solid var(--apex-border)' }}>
                <span
                  className="font-display leading-none"
                  style={{ fontSize: '2.25rem', color: 'var(--apex-gold)' }}
                >
                  {player.bestWpm}
                </span>
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase mt-1.5"
                  style={{ color: 'var(--apex-text-dim)' }}
                >
                  Best WPM
                </span>
              </div>

              <div className="flex flex-col items-center py-5 px-3">
                <span
                  className="font-display leading-none"
                  style={{ fontSize: '2.25rem', color: 'var(--apex-text)' }}
                >
                  {Math.round(player.avgAccuracy * 100)}%
                </span>
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase mt-1.5"
                  style={{ color: 'var(--apex-text-dim)' }}
                >
                  Avg Acc
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className="w-full max-w-sm flex flex-col gap-3 animate-slide-up"
          style={{ animationDelay: '0.08s' }}
        >
          <button
            onClick={handleEnterGame}
            className="w-full flex items-center justify-between px-6 py-4 rounded-lg font-semibold tracking-[0.18em] uppercase text-sm transition-all hover:brightness-110 active:scale-[0.985]"
            style={{
              background: 'var(--apex-gold)',
              color: '#0c0b09',
              fontFamily: 'var(--font-space), monospace',
            }}
          >
            <span>Enter Game Room</span>
            <span>▶</span>
          </button>

          <button
            onClick={handleSpectate}
            className="w-full flex items-center justify-between px-6 py-4 rounded-lg font-semibold tracking-[0.18em] uppercase text-sm transition-all hover:opacity-75 active:scale-[0.985]"
            style={{
              background: 'transparent',
              border: '1px solid var(--apex-border-bright)',
              color: 'var(--apex-text)',
              fontFamily: 'var(--font-space), monospace',
            }}
          >
            <span>Watch as Spectator</span>
            <span style={{ opacity: 0.5 }}>◉</span>
          </button>

          <Link
            href="/history"
            className="w-full flex items-center justify-between px-6 py-4 rounded-lg font-semibold tracking-[0.18em] uppercase text-sm transition-all hover:opacity-75 active:scale-[0.985]"
            style={{
              background: 'transparent',
              border: '1px solid var(--apex-border)',
              color: 'var(--apex-text-dim)',
              fontFamily: 'var(--font-space), monospace',
            }}
          >
            <span>Race History</span>
            <span style={{ opacity: 0.5 }}>↗</span>
          </Link>

        </div>
      </main>
    </>
  )
}