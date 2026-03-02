import type { Player } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StatsCard({ player }: { player: Player }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Stats — {player.username}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{player.totalRaces}</p>
          <p className="text-xs text-slate-500">Races</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{player.bestWpm}</p>
          <p className="text-xs text-slate-500">Best WPM</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{Math.round(player.avgAccuracy * 100)}%</p>
          <p className="text-xs text-slate-500">Avg Accuracy</p>
        </div>
      </CardContent>
    </Card>
  )
}
