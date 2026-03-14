import { create } from 'zustand'
import type { PlayerLiveState, Round } from '@/types'

type GameStore = {
  currentRound: Round | null
  setCurrentRound: (round: Round | null) => void

  localPlayerId: string | null
  localUsername: string | null
  setLocalPlayer: (id: string, username: string) => void
  clearLocalPlayer: () => void

  isInRoom: boolean
  setInRoom: (val: boolean) => void

  players: Map<string, PlayerLiveState>
  upsertPlayer: (state: PlayerLiveState) => void
  removePlayer: (playerId: string) => void
  resetPlayers: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  currentRound: null,
  setCurrentRound: (round) => set({ currentRound: round }),

  localPlayerId: null,
  localUsername: null,
  setLocalPlayer: (id, username) => set({ localPlayerId: id, localUsername: username }),
  clearLocalPlayer: () => set({ localPlayerId: null, localUsername: null }),

  isInRoom: false,
  setInRoom: (val) => set({ isInRoom: val }),

  players: new Map(),
  upsertPlayer: (playerState) =>
    set((state) => {
      const next = new Map(state.players)
      next.set(playerState.playerId, playerState)
      return { players: next }
    }),
  removePlayer: (playerId) =>
    set((state) => {
      const next = new Map(state.players)
      next.delete(playerId)
      return { players: next }
    }),
  resetPlayers: () => set({ players: new Map() }),
}))
