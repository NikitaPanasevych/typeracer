'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class LeaderboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-between px-5 py-4 rounded-lg"
          style={{ border: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}
        >
          <p
            className="text-xs tracking-wider uppercase font-mono"
            style={{ color: 'var(--apex-text-dim)' }}
          >
            Leaderboard unavailable
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-[11px] font-semibold tracking-[0.15em] uppercase transition-opacity hover:opacity-60"
            style={{ color: 'var(--apex-gold)' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
