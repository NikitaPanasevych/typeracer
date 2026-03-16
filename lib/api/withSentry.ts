import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>

export function withSentry(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
