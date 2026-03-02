import { NextRequest, NextResponse } from 'next/server'
import { getPlayerByUsername, createPlayer } from '@/lib/db/players'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const player = await getPlayerByUsername(username)
  return NextResponse.json({ player })
}

export async function POST(req: NextRequest) {
  const { username } = await req.json()
  if (!username?.trim()) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const existing = await getPlayerByUsername(username)
  if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

  const player = await createPlayer(username)
  if (!player) return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })

  return NextResponse.json({ player }, { status: 201 })
}
