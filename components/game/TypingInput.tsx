'use client'

import { useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
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

export function TypingInput({
  sentence,
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
  const progress = sentence.length > 0 ? (typedText.length / sentence.length) * 100 : 0

  return (
    <div className="animate-slide-up space-y-3">
      <div
        className="relative rounded-lg p-5 cursor-text select-none transition-all duration-200"
        style={{
          background: 'var(--apex-surface)',
          border: `1px solid ${isRoundActive && !isFinished ? 'rgba(240,180,41,0.2)' : 'var(--apex-border)'}`,
          boxShadow: isRoundActive && !isFinished
            ? '0 0 0 1px rgba(240,180,41,0.08), inset 0 0 40px rgba(0,0,0,0.3)'
            : 'inset 0 0 40px rgba(0,0,0,0.3)',
        }}
        onClick={() => inputRef.current?.focus()}
        onTouchEnd={() => inputRef.current?.focus()}
      >
        <div
          className="text-sm sm:text-lg leading-[2.2] tracking-wide"
          style={{ fontFamily: 'var(--font-space), monospace' }}
        >
          {charResults.map((result, i) => {
            const isCursor = i === typedText.length && !isDisabled
            return (
              <span key={i} className="relative">
                {isCursor && (
                  <span
                    className="animate-cursor-blink absolute -left-px top-[0.15em] w-[2px] h-[1.4em] rounded-sm"
                    style={{ background: 'var(--apex-gold)' }}
                  />
                )}
                <span
                  style={{
                    color:
                      result.status === 'correct'
                        ? 'var(--apex-green)'
                        : result.status === 'incorrect'
                        ? 'var(--apex-red)'
                        : 'var(--apex-text-dim)',
                    background:
                      result.status === 'incorrect' ? 'var(--apex-red-dim)' : 'transparent',
                    borderRadius: result.status === 'incorrect' ? '2px' : undefined,
                    transition: 'color 0.08s ease',
                  }}
                >
                  {result.char}
                </span>
              </span>
            )
          })}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden"
          style={{ background: 'var(--apex-border)' }}
        >
          <div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: isFinished
                ? 'var(--apex-green)'
                : 'linear-gradient(90deg, var(--apex-gold), rgba(240,180,41,0.7))',
              boxShadow: '0 0 6px rgba(240,180,41,0.4)',
            }}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        value={typedText}
        onChange={(e) => onType(e.target.value)}
        disabled={isDisabled}
        aria-label="Type the sentence above"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center gap-6 px-1">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-display leading-none"
            style={{ fontSize: '2rem', color: 'var(--apex-gold)' }}
          >
            {wpm}
          </span>
          <span className="apex-stat-label">WPM</span>
        </div>

        <div
          className="w-px h-6 self-center"
          style={{ background: 'var(--apex-border-bright)' }}
        />

        <div className="flex items-baseline gap-1.5">
          <span
            className="font-display leading-none"
            style={{ fontSize: '2rem', color: 'var(--apex-text)' }}
          >
            {Math.round(accuracy * 100)}
          </span>
          <span className="apex-stat-label">ACC%</span>
        </div>

        {isFinished && (
          <Badge variant="apex-finished" className="ml-auto animate-fade-in gap-2 px-3 py-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
            Finished
          </Badge>
        )}

        {!isRoundActive && !isFinished && (
          <p
            className="ml-auto text-xs tracking-wider uppercase"
            style={{ color: 'var(--apex-text-dim)' }}
          >
            Waiting for round…
          </p>
        )}
      </div>
    </div>
  )
}
