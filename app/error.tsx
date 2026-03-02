'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-2">
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase"
          style={{ color: 'var(--apex-gold)' }}
        >
          System Error
        </p>
        <h2
          className="font-display leading-none"
          style={{ fontSize: '3rem', color: 'var(--apex-text)', letterSpacing: '0.08em' }}
        >
          RACE ABORTED
        </h2>
        <p
          className="text-sm mt-3 max-w-sm"
          style={{ color: 'var(--apex-text-dim)', fontFamily: 'var(--font-space), monospace' }}
        >
          {error.message || 'An unexpected error occurred.'}
        </p>
      </div>

      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-200"
        style={{
          background: 'var(--apex-gold)',
          color: '#07080D',
          boxShadow: '0 0 20px rgba(240,180,41,0.25)',
        }}
      >
        Try Again →
      </button>
    </main>
  )
}
