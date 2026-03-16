import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db/rounds', () => ({
  getCachedCurrentRound: vi.fn(),
}))

import { getCachedCurrentRound } from '@/lib/db/rounds'

const mockGetCachedCurrentRound = getCachedCurrentRound as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

const makeReq = () => new NextRequest('http://localhost/api/round/current')

describe('GET /api/round/current', () => {
  it('returns { round: null } when no active round', async () => {
    mockGetCachedCurrentRound.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ round: null })
  })

  it('returns { round } when round exists', async () => {
    const round = { id: 'r1', sentence: 'hello', status: 'active' }
    mockGetCachedCurrentRound.mockResolvedValue(round)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ round })
  })

  it('returns 500 when getCachedCurrentRound throws', async () => {
    mockGetCachedCurrentRound.mockRejectedValue(new Error('db error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
