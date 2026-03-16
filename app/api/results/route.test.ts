import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { makeMockSupabase } from '@/__tests__/helpers/mockSupabase'
import { revalidateTag } from 'next/cache'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/db/results', () => ({
  upsertRoundResult: vi.fn(),
}))

vi.mock('@/lib/db/players', () => ({
  updatePlayerStats: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  resultsRatelimit: { limit: vi.fn() },
}))

import { createClient } from '@/lib/supabase/server'
import { upsertRoundResult } from '@/lib/db/results'
import { updatePlayerStats } from '@/lib/db/players'
import { resultsRatelimit } from '@/lib/ratelimit'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockUpsertRoundResult = upsertRoundResult as ReturnType<typeof vi.fn>
const mockUpdatePlayerStats = updatePlayerStats as ReturnType<typeof vi.fn>
const mockResultsLimit = resultsRatelimit.limit as ReturnType<typeof vi.fn>
const mockRevalidateTag = revalidateTag as ReturnType<typeof vi.fn>

const PLAYER_ID = '11111111-1111-1111-1111-111111111111'
const ROUND_ID = '22222222-2222-2222-2222-222222222222'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/results', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  roundId: ROUND_ID,
  playerId: PLAYER_ID,
  wpm: 80,
  accuracy: 0.95,
  finishedTyping: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue(makeMockSupabase(PLAYER_ID))
  mockResultsLimit.mockResolvedValue({ success: true })
  mockUpsertRoundResult.mockResolvedValue(undefined)
  mockUpdatePlayerStats.mockResolvedValue(undefined)
})

describe('POST /api/results', () => {
  it('returns 401 when no auth', async () => {
    mockCreateClient.mockResolvedValue(makeMockSupabase(null))
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when roundId is missing', async () => {
    const res = await POST(makeReq({ ...validBody, roundId: undefined }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when roundId is invalid UUID', async () => {
    const res = await POST(makeReq({ ...validBody, roundId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when playerId is invalid UUID', async () => {
    const res = await POST(makeReq({ ...validBody, playerId: 'bad' }))
    expect(res.status).toBe(400)
  })

  it('returns 403 when playerId does not match user.id', async () => {
    const otherPlayerId = '33333333-3333-3333-3333-333333333333'
    const res = await POST(makeReq({ ...validBody, playerId: otherPlayerId }))
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited', async () => {
    mockResultsLimit.mockResolvedValue({ success: false })
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(429)
  })

  it('returns 400 when wpm is negative', async () => {
    const res = await POST(makeReq({ ...validBody, wpm: -1 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when wpm > 300', async () => {
    const res = await POST(makeReq({ ...validBody, wpm: 301 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when accuracy > 1', async () => {
    const res = await POST(makeReq({ ...validBody, accuracy: 1.1 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when finishedTyping is a string', async () => {
    const res = await POST(makeReq({ ...validBody, finishedTyping: 'true' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when upsertRoundResult throws', async () => {
    mockUpsertRoundResult.mockRejectedValue(new Error('db error'))
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(500)
  })

  it('calls upsertRoundResult, updatePlayerStats, revalidateTag and returns 200 on happy path', async () => {
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
    expect(mockUpsertRoundResult).toHaveBeenCalledOnce()
    expect(mockUpdatePlayerStats).toHaveBeenCalledWith(PLAYER_ID, validBody.wpm, validBody.accuracy)
    expect(mockRevalidateTag).toHaveBeenCalledWith('player', { expire: 0 })
  })
})
