import { vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

process.env.CRON_SECRET = 'test-secret'
