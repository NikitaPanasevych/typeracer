'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { pusherClient } from '@/lib/pusher/client'
import type { Round } from '@/types'

type RoundState = {
  round: Round | null
  secondsLeft: number
  isLoading: boolean
  error: string | null
}

function computeSecondsLeft(round: Round | null): number {
  if (!round) return 0
  return Math.max(0, Math.floor((new Date(round.endsAt).getTime() - Date.now()) / 1000))
}

export function useRound() {
  const [state, setState] = useState<RoundState>({
    round: null,
    secondsLeft: 0,
    isLoading: true,
    error: null,
  })

  const roundIdRef = useRef<string | null>(null)

  const fetchCurrentRound = useCallback(async () => {
    try {
      const res = await fetch('/api/round/current')
      if (!res.ok) throw new Error('Failed to fetch round')
      const { round } = await res.json() as { round: Round | null }
      setState((prev) => {
        if (round && prev.round?.id && round.id !== prev.round.id) {
          toast.info('New round started!')
        }
        return {
          ...prev,
          round,
          secondsLeft: computeSecondsLeft(round),
          isLoading: false,
          error: null,
        }
      })
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Could not load round' }))
    }
  }, [])

  useEffect(() => {
    fetchCurrentRound()

    const pollRef = { id: 0 }
    pollRef.id = window.setInterval(fetchCurrentRound, 2000)

    const channel = pusherClient.subscribe('game')
    channel.bind('round_changed', fetchCurrentRound)

    return () => {
      window.clearInterval(pollRef.id)
      channel.unbind('round_changed', fetchCurrentRound)
      pusherClient.unsubscribe('game')
    }
  }, [fetchCurrentRound])

  useEffect(() => {
    if (!state.round) return
    if (state.round.id === roundIdRef.current && state.secondsLeft === 0) return

    roundIdRef.current = state.round.id

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        secondsLeft: computeSecondsLeft(prev.round),
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [state.round?.id])

  return state
}
