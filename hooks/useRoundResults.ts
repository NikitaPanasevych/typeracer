'use client'

import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'

type Props = {
  roundId: string | null
  playerId: string | null
  isRoundActive: boolean
  wpm: number
  accuracy: number
  isFinished: boolean
  onSaved?: () => void
}

export function useRoundResults({ roundId, playerId, isRoundActive, wpm, accuracy, isFinished, onSaved }: Props) {
  const hasSavedRef = useRef(false)
  const wpmRef = useRef(wpm)
  const accuracyRef = useRef(accuracy)
  const isFinishedRef = useRef(isFinished)
  const onSavedRef = useRef(onSaved)

  wpmRef.current = wpm
  accuracyRef.current = accuracy
  isFinishedRef.current = isFinished
  onSavedRef.current = onSaved

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
      body: JSON.stringify({
        roundId,
        playerId,
        wpm: wpmRef.current,
        accuracy: accuracyRef.current,
        finishedTyping: isFinishedRef.current,
      }),
    })
      .then((res) => { if (res.ok) onSavedRef.current?.() })
      .catch((err) => { Sentry.captureException(err); toast.error('Failed to save results') })
  }, [isRoundActive, isFinished, roundId, playerId])
}
