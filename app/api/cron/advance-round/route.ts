import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRound, createNewRound, finishRound, getRandomSentenceId } from '@/lib/db/rounds'
import { pusherServer } from '@/lib/pusher/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const currentRound = await getCurrentRound()
    if (currentRound) {
      await finishRound(currentRound.id)
    }

    const sentenceId = await getRandomSentenceId()
    if (!sentenceId) {
      return NextResponse.json({ error: 'No sentences available' }, { status: 500 })
    }

    const newRound = await createNewRound(sentenceId, 60)
    if (!newRound) {
      return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
    }

    await pusherServer.trigger('game', 'round_changed', { roundId: newRound.id })
    console.log(`[advance-round] New round created: ${newRound.id}`)
    return NextResponse.json({ round: newRound }, { status: 200 })
  } catch (error) {
    console.error('[advance-round]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
