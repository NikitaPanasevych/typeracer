'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useGameStore } from '@/lib/store/gameStore'
import { createClient } from '@/lib/supabase/client'
import { setSentryUser, clearSentryUser } from '@/lib/sentry'
import type { Player } from '@/types'

type PlayerHookState = {
  player: Player | null
  isLoading: boolean
  isJoined: boolean
  join: (username: string, password: string, mode: 'signup' | 'signin') => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshPlayer: () => Promise<void>
}

export function usePlayer(): PlayerHookState {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const clearLocalPlayer = useGameStore((s) => s.clearLocalPlayer)

  useEffect(() => {
    async function restoreSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const res = await fetch(`/api/players?id=${user.id}`)
        const { player: existing } = await res.json()

        if (existing) {
          setPlayer(existing)
          setLocalPlayer(existing.id, existing.username)
          setSentryUser(existing.id, existing.username)
        }
      } else {
        setPlayer(null)
        clearLocalPlayer()
        clearSentryUser()
      }

      setIsLoading(false)
    }

    void restoreSession()

    window.addEventListener('focus', restoreSession)
    return () => window.removeEventListener('focus', restoreSession)
  }, [setLocalPlayer, clearLocalPlayer])

  const join = async (username: string, password: string, mode: 'signup' | 'signin'): Promise<{ error?: string }> => {
    const trimmed = username.trim()
    if (!trimmed) return { error: 'Username cannot be empty' }
    if (trimmed.length < 2) return { error: 'Username must be at least 2 characters' }
    if (trimmed.length > 20) return { error: 'Username must be 20 characters or less' }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return { error: 'Only letters, numbers, _ and - allowed' }
    if (!password || password.length < 6) return { error: 'Password must be at least 6 characters' }

    const supabase = createClient()

    if (mode === 'signup') {
      const createRes = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, password }),
      })

      if (!createRes.ok) {
        const { error } = await createRes.json()
        return { error: error ?? 'Failed to create account' }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${trimmed}@typeracer.local`,
        password,
      })
      if (signInError) return { error: 'Account created but sign-in failed. Try signing in.' }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'Authentication failed' }

      const res = await fetch(`/api/players?id=${user.id}`)
      const { player: newPlayer } = await res.json()
      setPlayer(newPlayer)
      setLocalPlayer(newPlayer.id, newPlayer.username)
      setSentryUser(newPlayer.id, newPlayer.username)
      toast.success(`Welcome, ${newPlayer.username}!`)
      return {}
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${trimmed}@typeracer.local`,
      password,
    })
    if (signInError) return { error: 'Invalid username or password' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication failed' }

    const res = await fetch(`/api/players?id=${user.id}`)
    const { player: existing } = await res.json()
    if (!existing) return { error: 'Player not found' }

    setPlayer(existing)
    setLocalPlayer(existing.id, existing.username)
    setSentryUser(existing.id, existing.username)
    toast.success(`Welcome back, ${existing.username}!`)
    return {}
  }

  const refreshPlayer = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch(`/api/players?id=${user.id}`)
    const { player: fresh } = await res.json()
    if (fresh) setPlayer(fresh)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setPlayer(null)
    clearLocalPlayer()
    clearSentryUser()
  }

  return {
    player,
    isLoading,
    isJoined: !!player,
    join,
    logout,
    refreshPlayer,
  }
}