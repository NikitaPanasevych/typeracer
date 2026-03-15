'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onJoin: (username: string, password: string, mode: 'signup' | 'signin') => Promise<{ error?: string }>
  onClose?: () => void
}

export function JoinModal({ open, onJoin, onClose }: Props) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = username.trim() && password.length >= 6

  async function handleSubmit() {
    setError('')
    setIsSubmitting(true)
    const result = await onJoin(username, password, mode)
    if (result.error) setError(result.error)
    setIsSubmitting(false)
  }

  function switchMode() {
    setMode(m => m === 'signup' ? 'signin' : 'signup')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-xl"
        style={{
          background: 'var(--apex-surface)',
          border: '1px solid rgba(240,180,41,0.2)',
          boxShadow: '0 0 0 1px rgba(240,180,41,0.06), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--apex-gold), transparent)' }}
        />

        <DialogHeader className="px-8 pt-8 pb-2 gap-3 text-left">
          <p className="apex-section-cap" style={{ color: 'var(--apex-gold)' }}>TypeRacer</p>
          <DialogTitle
            className="font-display leading-none text-left"
            style={{ fontSize: '3.5rem', color: 'var(--apex-text)' }}
          >
            {mode === 'signup' ? 'ENTER THE RACE' : 'WELCOME BACK'}
          </DialogTitle>
          <DialogDescription
            className="text-sm text-left"
            style={{ color: 'var(--apex-text-dim)' }}
          >
            {mode === 'signup'
              ? 'Create your account to start racing and track your stats.'
              : 'Sign in to restore your stats and rejoin the race.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pt-6 pb-8 space-y-3">
          <Input
            type="text"
            placeholder="e.g. ghost_typer"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
            className="font-mono tracking-[0.05em]"
            style={{
              background: 'var(--apex-surface-2)',
              border: '1px solid var(--apex-border-bright)',
              color: 'var(--apex-text)',
            }}
          />

          <Input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && canSubmit && handleSubmit()}
            className="font-mono tracking-[0.05em]"
            style={{
              background: 'var(--apex-surface-2)',
              border: '1px solid var(--apex-border-bright)',
              color: 'var(--apex-text)',
            }}
          />

          {error && (
            <p className="text-xs animate-fade-in" style={{ color: 'var(--apex-red)' }}>
              {error}
            </p>
          )}

          <Button
            variant="apex-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="w-full py-3 rounded-lg tracking-wider uppercase"
          >
            {isSubmitting
              ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
              : (mode === 'signup' ? 'Create Account →' : 'Sign In →')}
          </Button>

          <p className="text-center text-xs" style={{ color: 'var(--apex-text-dim)' }}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={switchMode}
              className="underline transition-opacity hover:opacity-60"
              style={{ color: 'var(--apex-gold)' }}
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
