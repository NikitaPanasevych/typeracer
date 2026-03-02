import { Skeleton } from '@/components/ui/skeleton'

export function GameLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-24 mx-auto" />
        <Skeleton className="h-12 w-32 mx-auto" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
