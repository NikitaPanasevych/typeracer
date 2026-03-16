'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-2">
        <p className="apex-section-cap" style={{ color: 'var(--apex-gold)' }}>
          System Error
        </p>
        <h2
          className="font-display leading-none"
          style={{ fontSize: '3rem', color: 'var(--apex-text)', letterSpacing: '0.08em' }}
        >
          RACE ABORTED
        </h2>
        <p
          className="text-sm mt-3 max-w-sm font-mono"
          style={{ color: 'var(--apex-text-dim)' }}
        >
          {error.message || 'An unexpected error occurred.'}
        </p>
      </div>

      <Button variant="apex-primary" onClick={reset} className="px-6 py-2.5 rounded-lg tracking-wider uppercase">
        Try Again →
      </Button>
    </main>
  )
}
