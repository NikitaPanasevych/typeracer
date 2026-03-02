import { NextRequest, NextResponse } from 'next/server'
import { upsertRoundResult } from '@/lib/db/results'
import { updatePlayerStats } from '@/lib/db/players'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { roundId, playerId, wpm, accuracy, finishedTyping } = body

  if (!roundId || !playerId) {
    return NextResponse.json({ error: 'roundId and playerId required' }, { status: 400 })
  }

  await upsertRoundResult({ roundId, playerId, wpm, accuracy, finishedTyping })
  await updatePlayerStats(playerId, wpm, accuracy)

  return NextResponse.json({ ok: true })
}
