'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'
import { pusherClient } from '@/lib/pusher/client'
import { presenceRoundChannel, PUSHER_EVENTS } from '@/lib/pusher/constants'
import { useGameStore } from '@/lib/store/gameStore'
import type { PlayerLiveState, PusherPlayerUpdatePayload } from '@/types'

type Props = {
  roundId: string | null
  localPlayerState: PlayerLiveState | null
}

export function useRealtimePlayers({ roundId, localPlayerState }: Props) {
  const { upsertPlayer, removePlayer, resetPlayers } = useGameStore()
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef<string>('')
  const localPlayerStateRef = useRef(localPlayerState)
  const hasWarnedDuplicateRef = useRef(false)

  localPlayerStateRef.current = localPlayerState

  const broadcastLocalState = useCallback(
    (state: PlayerLiveState, currentRoundId: string) => {
      if (state.typedText === lastSentRef.current) return
      if (throttleRef.current) return

      throttleRef.current = setTimeout(async () => {
        lastSentRef.current = state.typedText
        throttleRef.current = null

        try {
          await fetch('/api/typing-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...state, roundId: currentRoundId }),
          })
        } catch (err) {
          Sentry.captureException(err)
        }
      }, 150)
    },
    []
  )

  useEffect(() => {
    if (!roundId) return

    resetPlayers()
    lastSentRef.current = ''
    hasWarnedDuplicateRef.current = false

    const channelName = presenceRoundChannel(roundId)
    const channel = pusherClient.subscribe(channelName) as ReturnType<typeof pusherClient.subscribe> & {
      members: {
        me: { id: string; info: Record<string, unknown> }
        get: (id: string) => { id: string } | null
      }
    }

    channel.bind(PUSHER_EVENTS.PLAYER_UPDATE, (payload: PusherPlayerUpdatePayload) => {
      upsertPlayer(payload)
    })

    channel.bind('pusher:member_removed', (member: { id: string }) => {
      const players = useGameStore.getState().players
      const byUserId = [...players.values()].find((p) => p.playerId === member.id)
      if (byUserId) removePlayer(byUserId.playerId)
    })

    channel.bind('pusher:subscription_succeeded', () => {
      const me = channel.members?.me
      if (!me || !localPlayerStateRef.current || hasWarnedDuplicateRef.current) return
      const existing = channel.members?.get(me.id)
      if (existing) {
        hasWarnedDuplicateRef.current = true
        toast.warning('You are already connected in another tab.')
      }
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
        throttleRef.current = null
      }
    }
  }, [roundId, upsertPlayer, removePlayer, resetPlayers])

  useEffect(() => {
    if (!localPlayerState || !roundId) return
    broadcastLocalState(localPlayerState, roundId)
  }, [localPlayerState, roundId, broadcastLocalState])
}
