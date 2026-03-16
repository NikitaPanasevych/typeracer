import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { makeMockSupabase } from '@/__tests__/helpers/mockSupabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pusher/server', () => ({
  pusherServer: {
    authorizeChannel: vi.fn(),
  },
}))

vi.mock('@/lib/db/players', () => ({
  getCachedPlayerById: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { pusherServer } from '@/lib/pusher/server'
import { getCachedPlayerById } from '@/lib/db/players'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockAuthorizeChannel = pusherServer.authorizeChannel as ReturnType<typeof vi.fn>
const mockGetCachedPlayerById = getCachedPlayerById as ReturnType<typeof vi.fn>

const USER_ID = 'user-uuid'
const mockPlayer = { id: USER_ID, username: 'alice', totalRaces: 0, bestWpm: 0, avgAccuracy: 0 }

function makePusherRequest(socketId?: string, channelName?: string) {
  const parts: string[] = []
  if (socketId !== undefined) parts.push(`socket_id=${socketId}`)
  if (channelName !== undefined) parts.push(`channel_name=${channelName}`)
  return new NextRequest('http://localhost/api/pusher/auth', {
    method: 'POST',
    body: parts.join('&'),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue(makeMockSupabase(USER_ID))
  mockGetCachedPlayerById.mockResolvedValue(mockPlayer)
  mockAuthorizeChannel.mockReturnValue({ auth: 'pusher-auth-token' })
})

describe('POST /api/pusher/auth', () => {
  it('returns 401 when no auth', async () => {
    mockCreateClient.mockResolvedValue(makeMockSupabase(null))
    const res = await POST(makePusherRequest('123.456', 'presence-round-abc'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when socket_id is missing', async () => {
    const res = await POST(makePusherRequest(undefined, 'presence-round-abc'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when channel_name is missing', async () => {
    const res = await POST(makePusherRequest('123.456', undefined))
    expect(res.status).toBe(400)
  })

  it('calls getCachedPlayerById and authorizeChannel on happy path', async () => {
    const res = await POST(makePusherRequest('123.456', 'presence-round-abc'))
    expect(res.status).toBe(200)
    expect(mockGetCachedPlayerById).toHaveBeenCalledWith(USER_ID)
    expect(mockAuthorizeChannel).toHaveBeenCalledWith(
      '123.456',
      'presence-round-abc',
      expect.objectContaining({ user_id: USER_ID })
    )
    const body = await res.json()
    expect(body).toEqual({ auth: 'pusher-auth-token' })
  })
})
