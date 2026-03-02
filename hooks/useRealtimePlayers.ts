'use client'

import { useEffect, useRef, useCallback } from 'react'
import { pusherClient } from '@/lib/pusher/client'
import { roundChannel, PUSHER_EVENTS } from '@/lib/pusher/constants'
import { useGameStore } from '@/lib/store/gameStore'
import type { PlayerLiveState, PusherPlayerUpdatePayload } from '@/types'

type Props = {
  roundId: string | null
  localPlayerState: PlayerLiveState | null
}

export function useRealtimePlayers({ roundId, localPlayerState }: Props) {
  const { upsertPlayer, resetPlayers } = useGameStore()
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef<string>('')

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
          console.error('[useRealtimePlayers] Failed to send update:', err)
        }
      }, 150)
    },
    []
  )

  useEffect(() => {
    if (!roundId) return

    resetPlayers()
    lastSentRef.current = ''

    const channelName = roundChannel(roundId)
    const channel = pusherClient.subscribe(channelName)

    channel.bind(PUSHER_EVENTS.PLAYER_UPDATE, (payload: PusherPlayerUpdatePayload) => {
      upsertPlayer(payload)
    })

    return () => {
      channel.unbind(PUSHER_EVENTS.PLAYER_UPDATE)
      pusherClient.unsubscribe(channelName)
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
        throttleRef.current = null
      }
    }
  }, [roundId, upsertPlayer, resetPlayers])

  useEffect(() => {
    if (!localPlayerState || !roundId) return
    broadcastLocalState(localPlayerState, roundId)
  }, [localPlayerState, roundId, broadcastLocalState])
}
