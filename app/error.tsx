'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="text-slate-500 text-sm">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
