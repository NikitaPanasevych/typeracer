import { createClient } from '@/lib/supabase/server';

export async function upsertRoundResult(result: {
	roundId: string;
	playerId: string;
	wpm: number;
	accuracy: number;
	finishedTyping: boolean;
}): Promise<void> {
	const supabase = await createClient();
	const { error } = await supabase.from('round_results').upsert(
		{
			round_id: result.roundId,
			player_id: result.playerId,
			wpm: result.wpm,
			accuracy: result.accuracy,
			finished_typing: result.finishedTyping,
		},
		{ onConflict: 'round_id,player_id' }
	);

	if (error) {
		throw new Error(`Failed to upsert round result: ${error.message}`);
	}
}
