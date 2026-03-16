import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db/players', () => ({
  getPlayerByUsername: vi.fn(),
  getCachedPlayerById: vi.fn(),
  createPlayer: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  signupRatelimit: { limit: vi.fn() },
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

import { getPlayerByUsername, getCachedPlayerById, createPlayer } from '@/lib/db/players'
import { signupRatelimit } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/server'

const mockGetPlayerByUsername = getPlayerByUsername as ReturnType<typeof vi.fn>
const mockGetCachedPlayerById = getCachedPlayerById as ReturnType<typeof vi.fn>
const mockCreatePlayer = createPlayer as ReturnType<typeof vi.fn>
const mockSignupLimit = signupRatelimit.limit as ReturnType<typeof vi.fn>
const mockCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

const mockPlayer = { id: 'p1', username: 'alice', totalRaces: 0, bestWpm: 0, avgAccuracy: 0 }
const mockAuthUser = { id: 'auth-user-id' }

let mockAdminCreateUser: ReturnType<typeof vi.fn>
let mockAdminDeleteUser: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockSignupLimit.mockResolvedValue({ success: true })
  mockGetPlayerByUsername.mockResolvedValue(null)
  mockCreatePlayer.mockResolvedValue(mockPlayer)
  mockAdminCreateUser = vi.fn().mockResolvedValue({ data: { user: mockAuthUser }, error: null })
  mockAdminDeleteUser = vi.fn().mockResolvedValue({})
  mockCreateAdminClient.mockResolvedValue({
    auth: {
      admin: {
        createUser: mockAdminCreateUser,
        deleteUser: mockAdminDeleteUser,
      },
    },
  })
})

function makeGetReq(params: Record<string, string>) {
  const url = new URL('http://localhost/api/players')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/players', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/players', () => {
  it('returns 400 when no params', async () => {
    const res = await GET(makeGetReq({}))
    expect(res.status).toBe(400)
  })

  it('returns player by username when found', async () => {
    mockGetPlayerByUsername.mockResolvedValue(mockPlayer)
    const res = await GET(makeGetReq({ username: 'alice' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ player: mockPlayer })
  })

  it('returns { player: null } when username not found', async () => {
    mockGetPlayerByUsername.mockResolvedValue(null)
    const res = await GET(makeGetReq({ username: 'nobody' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ player: null })
  })

  it('calls getCachedPlayerById when id param is provided', async () => {
    mockGetCachedPlayerById.mockResolvedValue(mockPlayer)
    const res = await GET(makeGetReq({ id: 'p1' }))
    expect(res.status).toBe(200)
    expect(mockGetCachedPlayerById).toHaveBeenCalledWith('p1')
  })
})

describe('POST /api/players', () => {
  it('returns 429 when rate limited', async () => {
    mockSignupLimit.mockResolvedValue({ success: false })
    const res = await POST(makePostReq({ username: 'alice', password: 'secret123' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 when username is missing', async () => {
    const res = await POST(makePostReq({ password: 'secret123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when username is blank whitespace', async () => {
    const res = await POST(makePostReq({ username: '   ', password: 'secret123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const res = await POST(makePostReq({ username: 'alice', password: '123' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when username is already taken', async () => {
    mockGetPlayerByUsername.mockResolvedValue(mockPlayer)
    const res = await POST(makePostReq({ username: 'alice', password: 'secret123' }))
    expect(res.status).toBe(409)
  })

  it('returns 500 when Supabase Auth returns error', async () => {
    mockAdminCreateUser.mockResolvedValue({ data: { user: null }, error: { message: 'auth error' } })
    const res = await POST(makePostReq({ username: 'alice', password: 'secret123' }))
    expect(res.status).toBe(500)
  })

  it('rolls back auth user and returns 500 when createPlayer returns null', async () => {
    mockCreatePlayer.mockResolvedValue(null)
    const res = await POST(makePostReq({ username: 'alice', password: 'secret123' }))
    expect(res.status).toBe(500)
    expect(mockAdminDeleteUser).toHaveBeenCalledWith(mockAuthUser.id)
  })

  it('returns 201 with player on happy path', async () => {
    const res = await POST(makePostReq({ username: 'alice', password: 'secret123' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toEqual({ player: mockPlayer })
  })
})
