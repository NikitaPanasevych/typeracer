import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getPlayerByUsername, getCachedPlayerById, createPlayer } from '@/lib/db/players'
import { createAdminClient } from '@/lib/supabase/server'
import { signupRatelimit } from '@/lib/ratelimit'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  const id = req.nextUrl.searchParams.get('id')

  if (username) {
    const player = await getPlayerByUsername(username)
    return NextResponse.json({ player })
  }

  if (id) {
    const player = await getCachedPlayerById(id)
    return NextResponse.json({ player })
  }

  return NextResponse.json({ error: 'username or id required' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await signupRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { username, password } = await req.json()

  if (!username?.trim()) return NextResponse.json({ error: 'username required' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'password must be at least 6 characters' }, { status: 400 })

  const existing = await getPlayerByUsername(username.trim())
  if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

  const admin = await createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: `${username.trim()}@typeracer.local`,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    Sentry.captureException(authError ?? new Error('createUser returned no user'))
    return NextResponse.json({ error: authError?.message ?? 'Failed to create account' }, { status: 500 })
  }

  const player = await createPlayer(username.trim(), authData.user.id)
  if (!player) {
    Sentry.captureException(new Error('createPlayer returned null'))
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }

  return NextResponse.json({ player }, { status: 201 })
}