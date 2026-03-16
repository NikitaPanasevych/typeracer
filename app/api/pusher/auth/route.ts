import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedPlayerById } from '@/lib/db/players'
import { withSentry } from '@/lib/api/withSentry'

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const text = await req.text()
  const params = new URLSearchParams(text)
  const socketId = params.get('socket_id')
  const channelName = params.get('channel_name')

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
  }

  const player = await getCachedPlayerById(user.id)

  const auth = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: user.id,
    user_info: { username: player?.username ?? null },
  })

  return NextResponse.json(auth)
}

export const POST = withSentry(handler)
