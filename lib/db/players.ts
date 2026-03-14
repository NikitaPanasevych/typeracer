import { createClient } from '@/lib/supabase/server'
import type { Player } from '@/types'

function mapToPlayer(row: {
  id: string
  username: string
  total_races: number
  best_wpm: number
  avg_accuracy: number
}): Player {
  return {
    id: row.id,
    username: row.username,
    totalRaces: row.total_races,
    bestWpm: row.best_wpm,
    avgAccuracy: row.avg_accuracy,
  }
}

export async function getPlayerByUsername(username: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) return null
  return mapToPlayer(data)
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('players').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapToPlayer(data)
}

export async function createPlayer(username: string, userId: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ id: userId, username })
    .select()
    .single()

  if (error || !data) return null
  return mapToPlayer(data)
}

export async function updatePlayerStats(
  playerId: string,
  newWpm: number,
  newAccuracy: number
): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('update_player_stats', {
    p_player_id: playerId,
    p_new_wpm: newWpm,
    p_new_accuracy: newAccuracy,
  })
  if (error) throw new Error(`Failed to update player stats: ${error.message}`)
}
