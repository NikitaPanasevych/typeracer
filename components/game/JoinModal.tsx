'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  onJoin: (username: string) => Promise<{ error?: string }>
}

export function JoinModal({ open, onJoin }: Props) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setError('')
    setIsSubmitting(true)
    const result = await onJoin(username)
    if (result.error) {
      setError(result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Join TypeRacer</DialogTitle>
          <DialogDescription>
            Enter a username to join the competition. If you&apos;ve played before, enter your old username to restore your stats.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="e.g. super_typer"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={20}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSubmit} disabled={isSubmitting || !username.trim()} className="w-full">
            {isSubmitting ? 'Joining...' : 'Join Competition'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
