import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypingEngine } from './useTypingEngine'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

import { toast } from 'sonner'

const defaultProps = {
  sentence: 'hello world',
  roundId: 'round-1',
  isRoundActive: true,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTypingEngine', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    expect(result.current.typedText).toBe('')
    expect(result.current.wpm).toBe(0)
    expect(result.current.accuracy).toBe(0)
    expect(result.current.isFinished).toBe(false)
    expect(result.current.charResults.every((r) => r.status === 'pending')).toBe(true)
  })

  it('does not update typedText when round is not active', () => {
    const { result } = renderHook(() =>
      useTypingEngine({ ...defaultProps, isRoundActive: false })
    )
    act(() => {
      result.current.handleChange('hello')
    })
    expect(result.current.typedText).toBe('')
  })

  it('updates typedText when round is active', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello')
    })
    expect(result.current.typedText).toBe('hello')
  })

  it('clamps typedText to sentence length', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello world extra')
    })
    expect(result.current.typedText).toBe('hello world')
  })

  it('reflects typed text in charResults', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello')
    })
    const typed = result.current.charResults.filter((r) => r.status !== 'pending')
    expect(typed).toHaveLength(5)
  })

  it('sets isFinished and calls toast when sentence is complete', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello world')
    })
    expect(result.current.isFinished).toBe(true)
    expect(toast.success).toHaveBeenCalledOnce()
  })

  it('ignores further handleChange calls after isFinished', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello world')
    })
    act(() => {
      result.current.handleChange('something else')
    })
    expect(result.current.typedText).toBe('hello world')
    expect(toast.success).toHaveBeenCalledOnce()
  })

  it('resets all state via reset()', () => {
    const { result } = renderHook(() => useTypingEngine(defaultProps))
    act(() => {
      result.current.handleChange('hello')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.typedText).toBe('')
    expect(result.current.wpm).toBe(0)
    expect(result.current.accuracy).toBe(0)
    expect(result.current.isFinished).toBe(false)
  })

  it('resets state when roundId changes', () => {
    const { result, rerender } = renderHook(
      (props) => useTypingEngine(props),
      { initialProps: defaultProps }
    )
    act(() => {
      result.current.handleChange('hello')
    })
    rerender({ ...defaultProps, roundId: 'round-2' })
    expect(result.current.typedText).toBe('')
    expect(result.current.isFinished).toBe(false)
  })
})
