import { createClient } from '@/lib/supabase/server'
import type { Round } from '@/types'

export async function getCurrentRound(): Promise<Round | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rounds')
    .select('*, sentences(text)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    sentence: (data.sentences as { text: string }).text,
    sentenceId: data.sentence_id,
    startedAt: data.started_at,
    endsAt: data.ends_at,
    status: data.status as 'active' | 'finished',
  }
}

export async function createNewRound(sentenceId: string, durationSeconds = 60): Promise<Round | null> {
  const supabase = await createClient()
  const now = new Date()
  const endsAt = new Date(now.getTime() + durationSeconds * 1000)

  const { data, error } = await supabase
    .from('rounds')
    .insert({
      sentence_id: sentenceId,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active',
    })
    .select('*, sentences(text)')
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    sentence: (data.sentences as { text: string }).text,
    sentenceId: data.sentence_id,
    startedAt: data.started_at,
    endsAt: data.ends_at,
    status: 'active',
  }
}

export async function finishRound(roundId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('rounds').update({ status: 'finished' }).eq('id', roundId)
}

export async function getRandomSentenceId(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sentences').select('id')
  if (error || !data?.length) return null
  const random = data[Math.floor(Math.random() * data.length)]
  return random.id
}
