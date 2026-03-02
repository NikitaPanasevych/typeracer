import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher/server'
import { roundChannel, PUSHER_EVENTS } from '@/lib/pusher/constants'
import type { PusherPlayerUpdatePayload } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { playerId, username, roundId, typedText, wpm, accuracy, isFinished } = body

  if (!playerId || !roundId || !username) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof wpm === 'number' && wpm > 300) {
    return NextResponse.json({ error: 'Invalid WPM value' }, { status: 400 })
  }

  const payload: PusherPlayerUpdatePayload = {
    playerId,
    username,
    typedText,
    wpm,
    accuracy,
    isFinished,
  }

  try {
    await pusherServer.trigger(roundChannel(roundId), PUSHER_EVENTS.PLAYER_UPDATE, payload)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[typing-update]', error)
    return NextResponse.json({ error: 'Failed to broadcast update' }, { status: 500 })
  }
}
