import { vi } from 'vitest'

export function makeMockSupabase(userId: string | null = 'user-uuid') {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
  }
}

export function makeMockAdminClient() {
  return {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  }
}
