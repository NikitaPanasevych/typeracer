import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { makeMockSupabase } from '@/__tests__/helpers/mockSupabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pusher/server', () => ({
  pusherServer: {
    trigger: vi.fn(),
  },
}))

vi.mock('@/lib/ratelimit', () => ({
  typingRatelimit: { limit: vi.fn() },
}))

import { createClient } from '@/lib/supabase/server'
import { pusherServer } from '@/lib/pusher/server'
import { typingRatelimit } from '@/lib/ratelimit'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockTrigger = pusherServer.trigger as ReturnType<typeof vi.fn>
const mockTypingLimit = typingRatelimit.limit as ReturnType<typeof vi.fn>

const USER_ID = 'user-uuid'
const ROUND_ID = 'round-abc'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/typing-update', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue(makeMockSupabase(USER_ID))
  mockTypingLimit.mockResolvedValue({ success: true })
  mockTrigger.mockResolvedValue(undefined)
})

describe('POST /api/typing-update', () => {
  it('returns 401 when no auth', async () => {
    mockCreateClient.mockResolvedValue(makeMockSupabase(null))
    const res = await POST(makeReq({ playerId: USER_ID, roundId: ROUND_ID, username: 'alice' }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    mockTypingLimit.mockResolvedValue({ success: false })
    const res = await POST(makeReq({ playerId: USER_ID, roundId: ROUND_ID, username: 'alice' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 when playerId is missing', async () => {
    const res = await POST(makeReq({ roundId: ROUND_ID, username: 'alice' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when roundId is missing', async () => {
    const res = await POST(makeReq({ playerId: USER_ID, username: 'alice' }))
    expect(res.status).toBe(400)
  })

  it('returns 403 when playerId does not match user.id', async () => {
    const res = await POST(makeReq({ playerId: 'other-user', roundId: ROUND_ID, username: 'alice' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when wpm > 300', async () => {
    const res = await POST(makeReq({ playerId: USER_ID, roundId: ROUND_ID, username: 'alice', wpm: 301 }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when pusher throws', async () => {
    mockTrigger.mockRejectedValue(new Error('pusher error'))
    const res = await POST(makeReq({ playerId: USER_ID, roundId: ROUND_ID, username: 'alice', wpm: 100 }))
    expect(res.status).toBe(500)
  })

  it('triggers pusher with correct channel and event on happy path', async () => {
    const res = await POST(makeReq({ playerId: USER_ID, roundId: ROUND_ID, username: 'alice', wpm: 100, accuracy: 0.95, isFinished: false }))
    expect(res.status).toBe(200)
    expect(mockTrigger).toHaveBeenCalledWith(
      `presence-round-${ROUND_ID}`,
      'player-update',
      expect.objectContaining({ playerId: USER_ID })
    )
  })
})
