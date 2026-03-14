'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getDiffResults,
  getCorrectWordCount,
  getCorrectCharCount,
  calculateWPM,
  calculateAccuracy,
  type CharResult,
} from '@/lib/game/calculations'

type TypingState = {
  typedText: string
  wpm: number
  accuracy: number
  isFinished: boolean
  charResults: CharResult[]
  handleChange: (value: string) => void
  reset: () => void
}

type Props = {
  sentence: string
  roundId: string
  isRoundActive: boolean
}

export function useTypingEngine({ sentence, roundId, isRoundActive }: Props): TypingState {
  const [typedText, setTypedText] = useState('')
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    setTypedText('')
    setWpm(0)
    setAccuracy(0)
    setIsFinished(false)
    startedAtRef.current = null
  }, [roundId])

  const handleChange = useCallback(
    (value: string) => {
      if (!isRoundActive || isFinished) return

      if (!startedAtRef.current) {
        startedAtRef.current = Date.now()
      }

      const clamped = value.slice(0, sentence.length)
      setTypedText(clamped)

      const elapsedSeconds = (Date.now() - startedAtRef.current) / 1000
      const correctWords = getCorrectWordCount(clamped, sentence)
      const correctChars = getCorrectCharCount(clamped, sentence)

      setWpm(calculateWPM(correctWords, elapsedSeconds))
      setAccuracy(calculateAccuracy(correctChars, clamped.length))

      if (clamped === sentence) {
        setIsFinished(true)
        toast.success('You finished!')
      }
    },
    [sentence, isRoundActive, isFinished]
  )

  const reset = useCallback(() => {
    setTypedText('')
    setWpm(0)
    setAccuracy(0)
    setIsFinished(false)
    startedAtRef.current = null
  }, [])

  const charResults = getDiffResults(typedText, sentence)

  return { typedText, wpm, accuracy, isFinished, charResults, handleChange, reset }
}
