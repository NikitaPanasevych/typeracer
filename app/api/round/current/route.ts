import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCurrentRound } from '@/lib/db/rounds'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const round = await getCurrentRound()

    if (!round) {
      return NextResponse.json({ round: null }, { status: 200 })
    }

    return NextResponse.json({ round }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to fetch current round' }, { status: 500 })
  }
}
