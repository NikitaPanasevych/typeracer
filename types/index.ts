export type Player = {
  id: string
  username: string
  totalRaces: number
  bestWpm: number
  avgAccuracy: number
}

export type Round = {
  id: string
  sentence: string
  sentenceId: string
  startedAt: string
  endsAt: string
  status: 'active' | 'finished'
}

export type RoundResult = {
  id: string
  roundId: string
  playerId: string
  username: string
  wpm: number
  accuracy: number
  finishedTyping: boolean
  position: number | null
}

export type PlayerLiveState = {
  playerId: string
  username: string
  typedText: string
  wpm: number
  accuracy: number
  isFinished: boolean
}

export type LeaderboardRow = PlayerLiveState & {
  position: number | null
}

export type PusherPlayerUpdatePayload = PlayerLiveState
