export const roundChannel = (roundId: string) => `round-${roundId}`
export const presenceRoundChannel = (roundId: string) => `presence-round-${roundId}`

export const PUSHER_EVENTS = {
  PLAYER_UPDATE: 'player-update',
  ROUND_CHANGED: 'round_changed',
} as const
