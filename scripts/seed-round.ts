import { createNewRound, getRandomSentenceId } from '../lib/db/rounds'

async function main() {
  const sentenceId = await getRandomSentenceId()
  if (!sentenceId) throw new Error('No sentences found — run Phase 2 seed first')
  const round = await createNewRound(sentenceId, 60)
  console.log('First round created:', round)
}

main()
