import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'

vi.mock('@/lib/db/rounds', () => ({
  getCurrentRound: vi.fn(),
  finishRound: vi.fn(),
  getRandomSentenceId: vi.fn(),
  createNewRound: vi.fn(),
}))

vi.mock('@/lib/pusher/server', () => ({
  pusherServer: {
    trigger: vi.fn(),
  },
}))

import { getCurrentRound, finishRound, getRandomSentenceId, createNewRound } from '@/lib/db/rounds'
import { pusherServer } from '@/lib/pusher/server'

const mockGetCurrentRound = getCurrentRound as ReturnType<typeof vi.fn>
const mockFinishRound = finishRound as ReturnType<typeof vi.fn>
const mockGetRandomSentenceId = getRandomSentenceId as ReturnType<typeof vi.fn>
const mockCreateNewRound = createNewRound as ReturnType<typeof vi.fn>
const mockTrigger = pusherServer.trigger as ReturnType<typeof vi.fn>
const mockRevalidateTag = revalidateTag as ReturnType<typeof vi.fn>

const newRound = { id: 'new-round-id', sentence: 'test', status: 'active' }

function makeReq(secret?: string) {
  return new NextRequest('http://localhost/api/cron/advance-round', {
    method: 'GET',
    headers: secret ? { 'x-cron-secret': secret } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentRound.mockResolvedValue(null)
  mockGetRandomSentenceId.mockResolvedValue('sentence-id')
  mockCreateNewRound.mockResolvedValue(newRound)
  mockFinishRound.mockResolvedValue(undefined)
  mockTrigger.mockResolvedValue(undefined)
})

describe('GET /api/cron/advance-round', () => {
  it('returns 401 when x-cron-secret header is missing', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await GET(makeReq('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 500 when getRandomSentenceId returns null', async () => {
    mockGetRandomSentenceId.mockResolvedValue(null)
    const res = await GET(makeReq('test-secret'))
    expect(res.status).toBe(500)
  })

  it('returns 500 when createNewRound returns null', async () => {
    mockCreateNewRound.mockResolvedValue(null)
    const res = await GET(makeReq('test-secret'))
    expect(res.status).toBe(500)
  })

  it('does not call finishRound when no current round', async () => {
    mockGetCurrentRound.mockResolvedValue(null)
    await GET(makeReq('test-secret'))
    expect(mockFinishRound).not.toHaveBeenCalled()
  })

  it('calls finishRound with current round id when round exists', async () => {
    mockGetCurrentRound.mockResolvedValue({ id: 'old-round' })
    await GET(makeReq('test-secret'))
    expect(mockFinishRound).toHaveBeenCalledWith('old-round')
  })

  it('triggers pusher and revalidates tag on happy path', async () => {
    const res = await GET(makeReq('test-secret'))
    expect(res.status).toBe(200)
    expect(mockTrigger).toHaveBeenCalledWith('game', 'round_changed', { roundId: newRound.id })
    expect(mockRevalidateTag).toHaveBeenCalledWith('round', { expire: 0 })
  })
})
