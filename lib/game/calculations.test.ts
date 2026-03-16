import { describe, it, expect } from 'vitest'
import {
  getDiffResults,
  getCorrectWordCount,
  getCorrectCharCount,
  calculateWPM,
  calculateAccuracy,
} from './calculations'

describe('getDiffResults', () => {
  it('returns all pending when typed is empty', () => {
    const result = getDiffResults('', 'hello')
    expect(result).toHaveLength(5)
    expect(result.every((r) => r.status === 'pending')).toBe(true)
  })

  it('returns all correct when fully correct', () => {
    const result = getDiffResults('hello', 'hello')
    expect(result.every((r) => r.status === 'correct')).toBe(true)
  })

  it('marks wrong chars as incorrect', () => {
    const result = getDiffResults('hxllo', 'hello')
    expect(result[0].status).toBe('correct')
    expect(result[1].status).toBe('incorrect')
    expect(result[2].status).toBe('correct')
  })

  it('marks untyped portion as pending when typed is shorter', () => {
    const result = getDiffResults('hel', 'hello')
    expect(result[0].status).toBe('correct')
    expect(result[1].status).toBe('correct')
    expect(result[2].status).toBe('correct')
    expect(result[3].status).toBe('pending')
    expect(result[4].status).toBe('pending')
  })

  it('output length always equals target length', () => {
    expect(getDiffResults('', 'hello world')).toHaveLength(11)
    expect(getDiffResults('hello world', 'hello world')).toHaveLength(11)
    expect(getDiffResults('hi', 'hello world')).toHaveLength(11)
  })
})

describe('getCorrectWordCount', () => {
  it('returns 0 for empty string', () => {
    expect(getCorrectWordCount('', 'hello world')).toBe(0)
  })

  it('counts word as correct when space is typed after it', () => {
    expect(getCorrectWordCount('hello ', 'hello world')).toBe(1)
  })

  it('does not count word in progress without trailing space', () => {
    expect(getCorrectWordCount('hello', 'hello world')).toBe(0)
  })

  it('counts only correct words when second word is wrong', () => {
    expect(getCorrectWordCount('hello wrold ', 'hello world test')).toBe(1)
  })

  it('counts both words when both are correct', () => {
    expect(getCorrectWordCount('hello world ', 'hello world test')).toBe(2)
  })
})

describe('getCorrectCharCount', () => {
  it('returns 0 for empty typed string', () => {
    expect(getCorrectCharCount('', 'hello')).toBe(0)
  })

  it('counts all matching chars', () => {
    expect(getCorrectCharCount('hello', 'hello')).toBe(5)
  })

  it('returns 0 when no chars match', () => {
    expect(getCorrectCharCount('xxxxx', 'hello')).toBe(0)
  })

  it('counts only up to target length when typed is longer', () => {
    expect(getCorrectCharCount('helloworld', 'hello')).toBe(5)
  })
})

describe('calculateWPM', () => {
  it('returns 0 when elapsedSeconds is less than 1', () => {
    expect(calculateWPM(10, 0.99)).toBe(0)
  })

  it('returns 0 when elapsedSeconds is 0', () => {
    expect(calculateWPM(10, 0)).toBe(0)
  })

  it('calculates correctly: 5 words / 30s = 10 WPM', () => {
    expect(calculateWPM(5, 30)).toBe(10)
  })

  it('rounds result to integer', () => {
    const result = calculateWPM(1, 7)
    expect(Number.isInteger(result)).toBe(true)
  })
})

describe('calculateAccuracy', () => {
  it('returns 0 when totalTyped is 0', () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it('returns 1 when all chars are correct', () => {
    expect(calculateAccuracy(1, 1)).toBe(1)
  })

  it('returns 0.5 for half correct', () => {
    expect(calculateAccuracy(5, 10)).toBe(0.5)
  })

  it('rounds to 3 decimal places', () => {
    expect(calculateAccuracy(1, 3)).toBe(0.333)
  })
})
