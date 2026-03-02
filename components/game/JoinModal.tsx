'use client'

import { useState } from 'react'

type Props = {
  open: boolean
  onJoin: (username: string) => Promise<{ error?: string }>
}

export function JoinModal({ open, onJoin }: Props) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    setError('')
    setIsSubmitting(true)
    const result = await onJoin(username)
    if (result.error) setError(result.error)
    setIsSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7, 8, 13, 0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-sm animate-slide-up relative overflow-hidden rounded-xl"
        style={{
          background: 'var(--apex-surface)',
          border: '1px solid rgba(240,180,41,0.2)',
          boxShadow: '0 0 0 1px rgba(240,180,41,0.06), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--apex-gold), transparent)' }}
        />

        <div className="px-8 pt-8 pb-2">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
            style={{ color: 'var(--apex-gold)' }}
          >
            TypeRacer
          </p>
          <h1
            className="font-display leading-none"
            style={{ fontSize: '3.5rem', color: 'var(--apex-text)' }}
          >
            ENTER THE RACE
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--apex-text-dim)' }}>
            Choose your callsign. Returning racer? Use your old name to restore your stats.
          </p>
        </div>

        <div className="px-8 pt-6 pb-8 space-y-4">
          <div>
            <input
              type="text"
              placeholder="e.g. ghost_typer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && username.trim() && handleSubmit()}
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--apex-surface-2)',
                border: '1px solid var(--apex-border-bright)',
                color: 'var(--apex-text)',
                fontFamily: 'var(--font-space), monospace',
                letterSpacing: '0.05em',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(240,180,41,0.4)'
                e.target.style.boxShadow = '0 0 0 3px rgba(240,180,41,0.08)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid var(--apex-border-bright)'
                e.target.style.boxShadow = 'none'
              }}
            />
            {error && (
              <p
                className="mt-2 text-xs animate-fade-in"
                style={{ color: 'var(--apex-red)' }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !username.trim()}
            className="w-full py-3 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: username.trim() && !isSubmitting
                ? 'var(--apex-gold)'
                : 'rgba(240,180,41,0.3)',
              color: username.trim() && !isSubmitting ? '#07080D' : 'rgba(240,180,41,0.6)',
              boxShadow: username.trim() && !isSubmitting
                ? '0 0 20px rgba(240,180,41,0.25)'
                : 'none',
            }}
          >
            {isSubmitting ? 'Joining race…' : 'Start Racing →'}
          </button>
        </div>
      </div>
    </div>
  )
}
