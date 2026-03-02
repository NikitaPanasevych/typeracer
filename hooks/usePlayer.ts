'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useGameStore } from '@/lib/store/gameStore'
import type { Player } from '@/types'

const STORAGE_KEY = 'typeracer_player_id'
const STORAGE_USERNAME_KEY = 'typeracer_username'

type PlayerHookState = {
  player: Player | null
  isLoading: boolean
  isJoined: boolean
  join: (username: string) => Promise<{ error?: string }>
}

export function usePlayer(): PlayerHookState {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)

  useEffect(() => {
    async function restoreSession() {
      const storedId = localStorage.getItem(STORAGE_KEY)
      const storedUsername = localStorage.getItem(STORAGE_USERNAME_KEY)

      if (storedId && storedUsername) {
        const res = await fetch(`/api/players?username=${encodeURIComponent(storedUsername)}`)
        const { player: existing } = await res.json()

        if (existing && existing.id === storedId) {
          setPlayer(existing)
          setLocalPlayer(existing.id, existing.username)
        } else {
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(STORAGE_USERNAME_KEY)
        }
      }

      setIsLoading(false)
    }

    restoreSession()
  }, [setLocalPlayer])

  const join = async (username: string): Promise<{ error?: string }> => {
    const trimmed = username.trim()
    if (!trimmed) return { error: 'Username cannot be empty' }
    if (trimmed.length < 2) return { error: 'Username must be at least 2 characters' }
    if (trimmed.length > 20) return { error: 'Username must be 20 characters or less' }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return { error: 'Only letters, numbers, _ and - allowed' }

    const checkRes = await fetch(`/api/players?username=${encodeURIComponent(trimmed)}`)
    const { player: existing } = await checkRes.json()

    let resolvedPlayer: Player

    if (existing) {
      resolvedPlayer = existing
    } else {
      const createRes = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })

      if (!createRes.ok) {
        const { error } = await createRes.json()
        return { error: error ?? 'Failed to create player' }
      }

      const { player: newPlayer } = await createRes.json()
      resolvedPlayer = newPlayer
    }

    localStorage.setItem(STORAGE_KEY, resolvedPlayer.id)
    localStorage.setItem(STORAGE_USERNAME_KEY, resolvedPlayer.username)

    setPlayer(resolvedPlayer)
    setLocalPlayer(resolvedPlayer.id, resolvedPlayer.username)

    if (existing) {
      toast.info(`Welcome back, ${resolvedPlayer.username}!`)
    } else {
      toast.success(`Welcome, ${resolvedPlayer.username}!`)
    }

    return {}
  }

  return {
    player,
    isLoading,
    isJoined: !!player,
    join,
  }
}
