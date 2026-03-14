import { NextRequest, NextResponse } from 'next/server'
import { getPlayerByUsername, getPlayerById, createPlayer } from '@/lib/db/players'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  const id = req.nextUrl.searchParams.get('id')

  if (username) {
    const player = await getPlayerByUsername(username)
    return NextResponse.json({ player })
  }

  if (id) {
    const player = await getPlayerById(id)
    return NextResponse.json({ player })
  }

  return NextResponse.json({ error: 'username or id required' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await req.json()
  if (!username?.trim()) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const existing = await getPlayerByUsername(username)
  if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

  const player = await createPlayer(username, user.id)
  if (!player) return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })

  return NextResponse.json({ player }, { status: 201 })
}