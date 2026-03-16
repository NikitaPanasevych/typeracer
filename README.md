# TypeRacer

A real-time multiplayer typing competition. Players join a shared round, race to type a sentence as fast and accurately as possible, and see each other's live progress in a sortable leaderboard. Rounds advance automatically every 60 seconds.

## Tech Stack

| Layer         | Choice                      | Why                                                                                     |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)     | Full-stack TypeScript, API routes, Vercel-native deployment                             |
| Database      | Supabase (PostgreSQL)       | Managed Postgres with generated TypeScript types, RLS, migrations                       |
| Auth          | Supabase Auth               | Cookie-based JWT sessions via `@supabase/ssr`; `auth.uid()` enforced on all writes      |
| Real-time     | Pusher (presence channels)  | Low-latency broadcast for live typing updates; presence events handle disconnect cleanup |
| Client state  | Zustand                     | Minimal, non-Redux store for ephemeral in-round player map                              |
| Table         | TanStack Table v8           | Headless sorting, filtering, pagination — full control over markup                      |
| URL state     | nuqs                        | Syncs sort column/direction to the URL so table state survives refresh                  |
| UI primitives | shadcn/ui + Tailwind CSS v4 | Unstyled-but-accessible base, custom dark theme layered on top                          |
| Monitoring    | Sentry                      | Client and server error tracking with user context; source maps uploaded at build time  |
| Tests         | Vitest + jsdom              | Fast, Vite-native unit tests for pure game logic                                        |
| Cron          | Vercel Cron                 | Serverless-native round advancement without a separate scheduler process                |

---

## Features

- **Real-time leaderboard** — every keystroke is broadcast via Pusher presence channels and reflected live in all connected clients
- **Fixed 60-second rounds** — a Vercel Cron job advances rounds automatically in production
- **WPM & accuracy** — calculated client-side on every keystroke; only correctly completed words count toward WPM
- **Persistent player stats** — total races, best WPM, average accuracy saved to Postgres; signing in restores them
- **Password-based accounts** — Supabase Auth backs every account; sessions are cookie-stored JWTs, synced across tabs on focus
- **URL-synced table sort** — sort column and direction are written to `?sort=&dir=` so refreshing preserves state
- **Race history** — `/history` page shows past rounds with sentence, timestamp, and per-round results; paginated 8 per page
- **Spectator mode** — join as a read-only observer without claiming a player slot
- **Loading & error states** — skeleton UI while data loads, toast notifications, Next.js `error.tsx` boundary, and a component-level `LeaderboardErrorBoundary` with retry
- **Error monitoring** — Sentry captures all unhandled exceptions on client and server; errors are tagged with the current player's username and ID
- **Custom dark/light theme** — "Apex" design system with gold/green/red accents, animated countdown, blinking cursor, progress bar; toggle persisted to `localStorage`

---

## Running Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- A [Pusher](https://pusher.com) app (free Sandbox plan is sufficient)
- A [Sentry](https://sentry.io) project — Next.js type (free tier is sufficient; optional for local dev)

### 1. Install dependencies

```bash
git clone <repo-url>
cd typeracer
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Pusher — server-side
PUSHER_APP_ID=<app-id>
PUSHER_KEY=<key>
PUSHER_SECRET=<secret>
PUSHER_CLUSTER=<cluster>

# Pusher — client-side (must be prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_PUSHER_KEY=<key>
NEXT_PUBLIC_PUSHER_CLUSTER=<cluster>

# Cron protection — any random secret string
CRON_SECRET=<random-secret>

# Upstash Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL=<upstash-redis-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-redis-token>

# Sentry (optional locally — set enabled: true in sentry.client.config.ts to test)
NEXT_PUBLIC_SENTRY_DSN=<dsn>
SENTRY_DSN=<dsn>
SENTRY_AUTH_TOKEN=<auth-token>
SENTRY_ORG=<org-slug>
SENTRY_PROJECT=<project-slug>
```

Sentry is disabled in development (`NODE_ENV !== 'production'`) by default. To test it locally, temporarily set `enabled: true` in `sentry.client.config.ts`.

### 3. Apply the database schema

In the Supabase dashboard → SQL Editor, run the migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_sentences.sql
```

Alternatively, with the Supabase CLI:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

### 4. (Optional) Regenerate TypeScript types

The generated `types/supabase.ts` is committed and reflects the current schema. If you change the schema, regenerate with:

```bash
npm run db:types
```

### 5. Start the app

```bash
npm run dev
```

### 6. Seed the first round

Vercel Cron does not run locally. Trigger the first round manually:

```bash
curl -X GET http://localhost:3000/api/cron/advance-round \
  -H "x-cron-secret: <your-CRON_SECRET>"
```

Subsequent rounds must also be advanced manually in local development. In production on Vercel, the cron fires automatically every minute.

### Running Tests

```bash
npm run test:run
```

---

## Architecture

### Data model

Four tables:

- **`sentences`** — seeded pool of English sentences to type
- **`players`** — persistent identity: username, total races, best WPM, avg accuracy
- **`rounds`** — one active round at a time; has `started_at`, `ends_at`, a FK to `sentences`, and a status (`active` | `finished`)
- **`round_results`** — final WPM/accuracy per player per round; unique on `(round_id, player_id)`

### Ephemeral vs persistent data

| Data                                      | Storage                                     | Rationale                                                                  |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Live typing text, live WPM, live accuracy | Pusher broadcast only (never written to DB) | Sub-100ms latency required; no value in persisting intermediate keystrokes |
| Final round result                        | `round_results` table                       | Needed for the historical leaderboard and stats aggregation                |
| Player identity & career stats            | `players` table                             | Persists across sessions                                                   |

Live state flows: client keystroke → `useTypingEngine` → throttled POST to `/api/typing-update` → Pusher server trigger → all subscribed clients → Zustand store → leaderboard re-render.

### Round management

A Vercel Cron job calls `GET /api/cron/advance-round` every minute. The endpoint:

1. Marks the current active round as `finished`
2. Picks a random sentence via `get_random_sentence_id()` Postgres RPC
3. Inserts a new round with `ends_at = now() + 60s`
4. Triggers a `round_changed` Pusher event on the `game` channel

All clients subscribe to `game/round_changed` and re-fetch the round immediately. A 2-second polling fallback also runs to handle cases where the Pusher event is missed (e.g. reconnection).

### Real-time architecture

Pusher was chosen over Supabase Realtime because:

- Supabase Realtime broadcasts DB change events (CDC), which would only fire on final result saves — not on every keystroke
- Pusher's arbitrary event/payload model maps directly to the `PlayerLiveState` type without any DB involvement
- The Pusher free tier (200 concurrent connections, 200k messages/day) is sufficient for this scale

Each round uses a Pusher **presence channel** (`presence-round-<roundId>`). Presence channels provide member tracking, which enables:

- Immediate cleanup when a tab closes (`pusher:member_removed` → `removePlayer`)
- Duplicate tab detection on `pusher:subscription_succeeded` (warns via toast if the same `user_id` is already present)

The Pusher auth endpoint (`/api/pusher/auth`) signs each channel subscription with `auth.uid()` and the player's username, so member identity is server-verified.

### Player identity & authentication

Players create an account with a username and password. Under the hood:

- A Supabase Auth user is created with email `<username>@typeracer.local` and the provided password
- A corresponding row is inserted into the `players` table keyed on `auth.uid()`
- The session is stored in a cookie via `@supabase/ssr` (`createBrowserClient`) — not `localStorage`

On subsequent visits, `supabase.auth.getUser()` reads the cookie-stored JWT and restores the session. A `window.focus` listener in `usePlayer` re-runs this check whenever the tab regains focus, so signing in on Tab A is reflected in Tab B the next time it is focused.

All server-side write endpoints verify `auth.uid() === playerId` before accepting data.

### Error monitoring

Sentry is initialised in three runtimes:

- **Browser** — `sentry.client.config.ts` (via Next.js automatic instrumentation)
- **Node.js server** — `sentry.server.config.ts` (via `instrumentation.ts`)
- **Edge** — `sentry.edge.config.ts` (via `instrumentation.ts`)

All `captureException` calls in API routes and client hooks tag the event with the current player's username and ID via `Sentry.setUser`, which is called in `usePlayer` on every login and cleared on logout. The `LeaderboardErrorBoundary` uses `componentDidCatch` to report component-level crashes and renders a "Leaderboard unavailable / Retry" fallback instead of a blank space.

Sentry is disabled in development (`NODE_ENV !== 'production'`) to avoid noise.

### Client state

Zustand holds two things:

- `localPlayerId` / `localUsername` set once on join, read by multiple hooks
- `players: Map<string, PlayerLiveState>` the live in-round player map, updated by every incoming Pusher event

Using a `Map` (rather than an array) gives O(1) upsert on every incoming broadcast, which matters when updates arrive at ~6–7 Hz per player.

### Typing engine

`useTypingEngine` is a self-contained hook that owns all keystroke logic:

- Clamps input to sentence length (no overtyping)
- Records `startedAt` on the first keystroke
- Recalculates WPM and accuracy on every change
- Only completed and correctly typed words count toward WPM (in-progress word is excluded)
- Accuracy = `correctChars / totalTyped` (0–1, rounded to 3 decimal places); defaults to `0` before the first keystroke

All calculation functions live in `lib/game/calculations.ts` as pure functions so they are independently testable.

### URL-synced table state

`nuqs` writes sort column and sort direction to `?sort=wpm&dir=desc`. The `Leaderboard` component initialises TanStack Table's `sorting` state from these query params on mount, so refreshing the page or sharing the URL preserves the sort.

---

## What I Would Add With More Time

### Completed

- ~~**Supabase Auth**~~ username + password accounts backed by Supabase Auth; sessions stored in cookies via `@supabase/ssr`; `auth.uid()` enforced on all writes
- ~~**Cross-tab session sync**~~ `window.focus` listener in `usePlayer` re-checks the session so signing in on one tab is reflected in others on next focus
- ~~**RLS policies**~~ `players` table write policies scoped to `auth.uid()`
- ~~**Atomic `updatePlayerStats`**~~ replaced read-modify-write with a Postgres RPC `update_player_stats` to eliminate the race condition
- ~~**Session token on write endpoints**~~ `/api/typing-update` and `/api/results` verify `auth.uid() === playerId`; returns 403 on mismatch
- ~~**Input validation on `/api/results`**~~ UUID format, `0 ≤ accuracy ≤ 1`, `0 ≤ wpm ≤ 300`, `boolean finishedTyping` all enforced
- ~~**Stale round-end save**~~ `useRoundResults` reads `wpm`/`accuracy` from refs at call time instead of capturing stale closure values
- ~~**Accuracy default**~~ `useTypingEngine` initialises accuracy to `0`; no phantom 100% before first keystroke
- ~~**Countdown hardcoded to 60s**~~ progress bar derives `totalSeconds` from `round.startedAt`/`round.endsAt`
- ~~**`Suspense` fallback**~~ `LeaderboardSkeleton` provided as fallback to the `<Suspense>` wrapping `Leaderboard`
- ~~**StatsCard staleness**~~ `refreshPlayer()` called via `onSaved` callback after each round result saves
- ~~**Wire up `useTheme`**~~ dark/light toggle button in homepage and game page header
- ~~**Disconnect detection**~~ presence channels fire `pusher:member_removed` on tab close; stale players removed immediately
- ~~**Single-session warning**~~ `pusher:subscription_succeeded` detects the same `user_id` already in the channel and warns via toast
- ~~**Presence channels**~~ subscribed to `presence-round-{id}`; Pusher auth endpoint signs subscriptions with `auth.uid()`
- ~~**`ORDER BY RANDOM() LIMIT 1`**~~ replaced full table scan with Postgres RPC `get_random_sentence_id()`
- ~~**Mobile / responsive support**~~ `opacity:0` hidden input, `inputMode="text"`, `onTouchEnd` focus; leaderboard horizontally scrollable
- ~~**Historical leaderboard**~~ `/history` page (server component) with past rounds, pagination, Done/DNF badges
- ~~**Logout**~~ sign-out button calls `supabase.auth.signOut()` and clears Zustand + Sentry user context
- ~~**Lobby / homepage**~~ dedicated `/` page with stats card, Enter Game Room, Watch as Spectator, Race History
- ~~**Error monitoring**~~ Sentry integrated across browser, Node, and edge runtimes; `captureException` on all error paths; user context tagged on login/logout; `LeaderboardErrorBoundary` reports crashes and shows a retry fallback
- ~~**No monitoring or observability**~~ Sentry captures and aggregates all unhandled errors in production with readable stack traces via source map upload
- ~~**Caching layer**~~ `unstable_cache` wraps `getCurrentRound` (5 s TTL, `round` tag) and `getPlayerById` (30 s TTL, `player` tag); `revalidateTag` called on round advance and after stats save
- ~~**Rate limiting**~~ Upstash Ratelimit with sliding-window limits on `/api/typing-update` (30 req / 10 s per user), `/api/results` (5 req / 60 s per user), and `/api/players` POST (5 req / hour per IP)

### Still To Do
- **Playwright E2E tests** — no integration coverage; a full join → type → finish → leaderboard flow across two browser sessions would catch regressions the unit tests miss
- **CI/CD pipeline** — no automated checks on PRs; GitHub Actions running `tsc --noEmit`, ESLint, and `vitest run` would prevent broken code from reaching `main`

---
