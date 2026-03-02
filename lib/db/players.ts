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

export async function createPlayer(username: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ username })
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
  const { data: current } = await supabase
    .from('players')
    .select('total_races, best_wpm, avg_accuracy')
    .eq('id', playerId)
    .single()

  if (!current) return

  const totalRaces = current.total_races + 1
  const bestWpm = Math.max(current.best_wpm, newWpm)
  const avgAccuracy =
    (current.avg_accuracy * current.total_races + newAccuracy) / totalRaces

  await supabase
    .from('players')
    .update({
      total_races: totalRaces,
      best_wpm: bestWpm,
      avg_accuracy: avgAccuracy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)
}
