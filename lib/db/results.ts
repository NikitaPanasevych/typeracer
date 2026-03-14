import { createClient } from '@/lib/supabase/server'
import type { HistoricalRound } from '@/types'

export async function upsertRoundResult(result: {
	roundId: string
	playerId: string
	wpm: number
	accuracy: number
	finishedTyping: boolean
}): Promise<void> {
	const supabase = await createClient()
	const { error } = await supabase.from('round_results').upsert(
		{
			round_id: result.roundId,
			player_id: result.playerId,
			wpm: result.wpm,
			accuracy: result.accuracy,
			finished_typing: result.finishedTyping,
		},
		{ onConflict: 'round_id,player_id' }
	)

	if (error) {
		throw new Error(`Failed to upsert round result: ${error.message}`)
	}
}

export async function getHistoricalRounds(
  page: number,
  limit: number
): Promise<{ rounds: HistoricalRound[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  const { count } = await supabase
    .from('rounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'finished')

  const { data, error } = await supabase
    .from('rounds')
    .select(`
      id,
      started_at,
      ends_at,
      sentences(text),
      round_results(
        player_id,
        wpm,
        accuracy,
        finished_typing,
        players(username)
      )
    `)
    .eq('status', 'finished')
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) return { rounds: [], total: 0 }

  const rounds: HistoricalRound[] = data.map((round) => {
    const results = ((round.round_results as Array<{
      player_id: string
      wpm: number
      accuracy: number
      finished_typing: boolean
      players: { username: string } | null
    }>) ?? [])
      .sort((a, b) => b.wpm - a.wpm)
      .map((r) => ({
        playerId: r.player_id,
        username: r.players?.username ?? 'Unknown',
        wpm: r.wpm,
        accuracy: r.accuracy,
        finishedTyping: r.finished_typing,
      }))

    return {
      roundId: round.id,
      sentence: (round.sentences as { text: string }).text,
      startedAt: round.started_at,
      endsAt: round.ends_at,
      results,
    }
  })

  return { rounds, total: count ?? 0 }
}
