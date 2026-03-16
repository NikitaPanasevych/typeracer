import * as Sentry from '@sentry/nextjs'

export function setSentryUser(id: string, username: string) {
  Sentry.setUser({ id, username })
}

export function clearSentryUser() {
  Sentry.setUser(null)
}
