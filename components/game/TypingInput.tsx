'use client'

import { useRef, useEffect } from 'react'
import type { CharResult } from '@/lib/game/calculations'

type Props = {
  sentence: string
  typedText: string
  charResults: CharResult[]
  wpm: number
  accuracy: number
  isFinished: boolean
  isRoundActive: boolean
  onType: (value: string) => void
}

const statusColors: Record<CharResult['status'], string> = {
  correct: 'text-green-600',
  incorrect: 'text-red-500 bg-red-50',
  pending: 'text-slate-400',
}

export function TypingInput({
  typedText,
  charResults,
  wpm,
  accuracy,
  isFinished,
  isRoundActive,
  onType,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRoundActive && !isFinished) {
      inputRef.current?.focus()
    }
  }, [isRoundActive, isFinished])

  const isDisabled = !isRoundActive || isFinished

  return (
    <div className="space-y-4">
      <div
        className="font-mono text-xl leading-relaxed p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-text select-none"
        onClick={() => inputRef.current?.focus()}
      >
        {charResults.map((result, i) => (
          <span key={i} className={statusColors[result.status]}>
            {result.char}
          </span>
        ))}
        {!isDisabled && (
          <span className="inline-block w-0.5 h-5 bg-slate-800 animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={(e) => onType(e.target.value)}
        disabled={isDisabled}
        className="sr-only"
        aria-label="Type the sentence above"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div className="flex gap-6 text-sm text-slate-600">
        <div>
          <span className="font-medium">{wpm}</span>
          <span className="ml-1">WPM</span>
        </div>
        <div>
          <span className="font-medium">{Math.round(accuracy * 100)}%</span>
          <span className="ml-1">accuracy</span>
        </div>
        {isFinished && (
          <div className="text-green-600 font-semibold">Finished!</div>
        )}
      </div>

      {!isRoundActive && !isFinished && (
        <p className="text-slate-400 text-sm italic">Waiting for next round...</p>
      )}
    </div>
  )
}
