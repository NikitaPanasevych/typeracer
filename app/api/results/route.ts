import { NextRequest, NextResponse } from 'next/server'
import { upsertRoundResult } from '@/lib/db/results'
import { updatePlayerStats } from '@/lib/db/players'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { roundId, playerId, wpm, accuracy, finishedTyping } = body

  if (!roundId || !playerId) {
    return NextResponse.json({ error: 'roundId and playerId required' }, { status: 400 })
  }

  if (!UUID_RE.test(roundId) || !UUID_RE.test(playerId)) {
    return NextResponse.json({ error: 'roundId and playerId must be valid UUIDs' }, { status: 400 })
  }

  if (user.id !== playerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (typeof wpm !== 'number' || !Number.isFinite(wpm) || wpm < 0 || wpm > 300) {
    return NextResponse.json({ error: 'wpm must be a number between 0 and 300' }, { status: 400 })
  }

  if (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
    return NextResponse.json({ error: 'accuracy must be a number between 0 and 1' }, { status: 400 })
  }

  if (typeof finishedTyping !== 'boolean') {
    return NextResponse.json({ error: 'finishedTyping must be a boolean' }, { status: 400 })
  }

  try {
    await upsertRoundResult({ roundId, playerId, wpm, accuracy, finishedTyping })
    await updatePlayerStats(playerId, wpm, accuracy)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
