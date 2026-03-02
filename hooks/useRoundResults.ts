'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

type Props = {
  roundId: string | null
  playerId: string | null
  isRoundActive: boolean
  wpm: number
  accuracy: number
  isFinished: boolean
}

export function useRoundResults({ roundId, playerId, isRoundActive, wpm, accuracy, isFinished }: Props) {
  const hasSavedRef = useRef(false)

  useEffect(() => {
    hasSavedRef.current = false
  }, [roundId])

  useEffect(() => {
    if (!roundId || !playerId) return
    if (hasSavedRef.current) return
    if (isRoundActive && !isFinished) return

    hasSavedRef.current = true

    fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, playerId, wpm, accuracy, finishedTyping: isFinished }),
    }).catch(() => {
      toast.error('Failed to save results')
    })
  }, [isRoundActive, isFinished, roundId, playerId, wpm, accuracy])
}
