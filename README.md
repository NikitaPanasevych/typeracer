# TypeRacer

A real-time multiplayer typing competition. Players join a shared round, race to type a sentence as fast and accurately as possible, and see each other's live progress in a sortable leaderboard. Rounds advance automatically every 60 seconds.

## Tech Stack

| Layer         | Choice                      | Why                                                                                     |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)     | Full-stack TypeScript, API routes, Vercel-native deployment                             |
| Database      | Supabase (PostgreSQL)       | Managed Postgres with generated TypeScript types, RLS, migrations                       |
| Real-time     | Pusher                      | Low-latency broadcast for live typing updates; simpler than maintaining WebSocket infra |
| Client state  | Zustand                     | Minimal, non-Redux store for ephemeral in-round player map                              |
| Table         | TanStack Table v8           | Headless sorting, filtering, pagination — full control over markup                      |
| URL state     | nuqs                        | Syncs sort column/direction to the URL so table state survives refresh                  |
| UI primitives | shadcn/ui + Tailwind CSS v4 | Unstyled-but-accessible base, custom dark theme layered on top                          |
| Tests         | Vitest + jsdom              | Fast, Vite-native unit tests for pure game logic                                        |
| Cron          | Vercel Cron                 | Serverless-native round advancement without a separate scheduler process                |

---

## Features

- **Real-time leaderboard** — every keystroke is broadcast via Pusher and reflected live in all connected clients
- **Fixed 60-second rounds** — a Vercel Cron job advances rounds automatically in production
- **WPM & accuracy** — calculated client-side on every keystroke; only correctly completed words count toward WPM
- **Persistent player stats** — total races, best WPM, average accuracy saved to Postgres; re-entering your username restores them
- **URL-synced table sort** — sort column and direction are written to `?sort=&dir=` so refreshing preserves state
- **Loading & error states** — skeleton UI while data loads, toast notifications, and a Next.js `error.tsx` boundary
- **Custom dark theme** — "Apex" design system with gold/green/red accents, animated countdown, blinking cursor, progress bar

---

## Running Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- A [Pusher](https://pusher.com) app (free Sandbox plan is sufficient)

### 1. Install dependencies

```bash
git clone <repo-url>
cd typeracer
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root with the following keys:

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
```

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
curl -X POST http://localhost:3000/api/cron/advance-round \
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
2. Picks a random sentence
3. Inserts a new round with `ends_at = now() + 60s`
4. Triggers a `round_changed` Pusher event on the `game` channel

All clients subscribe to `game/round_changed` and re-fetch the round immediately. A 2-second polling fallback also runs to handle cases where the Pusher event is missed (e.g. reconnection).

### Real-time architecture

Pusher was chosen over Supabase Realtime because:

- Supabase Realtime broadcasts DB change events (CDC), which would only fire on final result saves — not on every keystroke
- Pusher's arbitrary event/payload model maps directly to the `PlayerLiveState` type without any DB involvement
- The Pusher free tier (200 concurrent connections, 200k messages/day) is sufficient for this scale

Each round gets its own Pusher channel (`round-<roundId>`). When a round ends, clients naturally stop listening to the stale channel and subscribe to the new one — no explicit cleanup of old player states needed.

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
- Accuracy = `correctChars / totalTyped` (0–1, rounded to 3 decimal places)

All calculation functions live in `lib/game/calculations.ts` as pure functions so they are independently testable.

### Player identity

Username is the identity. On join, the username is looked up in the DB:

- **Exists** → session restored, stats loaded
- **Does not exist** → new player created

The resolved player ID is stored in `localStorage` alongside the username. On subsequent visits, both values are read and the server is asked to confirm the ID still matches — if not, the stored session is cleared. No passwords or tokens are involved (see Limitations).

### URL-synced table state

`nuqs` writes sort column and sort direction to `?sort=wpm&dir=desc`. The `Leaderboard` component initialises TanStack Table's `sorting` state from these query params on mount, so refreshing the page or sharing the URL preserves the sort.

---

## Simplifications & Known Limitations

**Authentication**
Username = identity with no secret. Any user can join as any username that hasn't been taken. A production system would use Supabase Auth (anonymous sign-in or OAuth) and tie all write operations to `auth.uid()`.

**No server-side write authorisation**
`/api/typing-update` and `/api/results` accept any `playerId` from the request body without verifying the caller owns that ID. A player could submit results on behalf of another. The fix is a session token issued at player creation and validated server-side on every write. The current WPM > 300 guard is a single sanity check, not proper auth.

**RLS policies are wide-open**
All four tables have `using (true)` policies for inserts and updates. In production, these must be scoped to `auth.uid() = player.id`.

**`updatePlayerStats` has a read-modify-write race**
The function reads current stats, computes new values in application code, then writes back. Two simultaneous saves for the same player will produce a lost update. The fix is a Postgres function that does the increment atomically.

**`getRandomSentenceId` loads all rows**
Every round advance fetches all sentence IDs from the DB and samples client-side. Fine for 20 sentences, becomes a full table scan at scale. Fix: `SELECT id FROM sentences ORDER BY RANDOM() LIMIT 1`.

**Cron does not run locally**
Vercel Cron is cloud-only. Rounds must be advanced manually in local dev.

**No disconnect detection**
Players who close their tab remain in the leaderboard until the round ends and the player map resets. A production implementation would use Pusher presence channels with a heartbeat and timeout-based cleanup.

**Countdown progress bar hardcoded to 60s**
The visual progress bar in `Countdown.tsx` assumes a 60-second round. If the round duration is changed, the bar will be incorrect. It should derive the maximum from `round.startedAt` and `round.endsAt`.

**Tests are unit-only**
Only `lib/game/calculations.ts` is covered. There are no integration tests for API routes or E2E tests for the full player journey, as time was limited and focus was on the functional MVP.

**Concurrent sessions with the same username**
The same username can be opened in two different browsers simultaneously. Both sessions will share the same `playerId`, causing conflicting typing updates and corrupt live state on the leaderboard. A production fix would enforce single-session per player via a server-issued session token or Pusher presence channel membership check.

**StatsCard does not react to external data changes**
The `StatsCard` (persistent player stats: total races, best WPM, average accuracy) is only fetched once on join and is not updated when new results are saved to the database. If a round ends and `updatePlayerStats` writes new values, the card remains stale until the page is refreshed. A production system could use Server-Sent Events (SSE) or Supabase Realtime subscriptions to push DB-level changes to the client.

**No logout functionality**
Once a user joins, there is no way to log out or switch usernames without manually clearing `localStorage`. A logout button should clear the stored `typeracer_player_id` and `typeracer_username` keys and reset the Zustand store.

**Accuracy defaults to 100% before typing**
`calculateAccuracy` returns `1` (100%) when `totalTyped === 0`. This means a player who never types a single character appears with perfect accuracy. A more honest default would be `0` or `null` (displayed as "—") until the first keystroke.

**No caching layer**
Every API call hits Supabase directly with no intermediate cache. Frequently read data — the current round, sentence text, player profiles — could benefit from short-TTL caching (e.g. Vercel Data Cache, Upstash Redis, or Next.js `unstable_cache`) to reduce latency and database load.

**No monitoring or observability**
The application has no structured logging, metrics, or error tracking. Failures in API routes or Pusher broadcasts are only visible in Vercel function logs. A production deployment should include an APM tool (e.g. Sentry, Datadog) and structured logging (e.g. Pino) for both client and server.

**No input validation on `/api/results`**
`roundId`, `playerId`, `wpm`, `accuracy`, and `finishedTyping` are accepted without type or range validation. Unlike `/api/typing-update` (which has the WPM > 300 guard), this endpoint passes values directly to `upsertRoundResult`. A malicious caller could submit negative WPM, accuracy > 1, or invalid UUIDs.

**`useRoundResults` can save stale values**
The effect fires when `isRoundActive` flips to `false` or `isFinished` flips to `true`, but captures `wpm` and `accuracy` from the closure at that moment. If the round ends exactly while the player is mid-keystroke, the saved values may be one render cycle behind the latest.

**No mobile / responsive support**
The hidden `<input>` approach in `TypingInput.tsx` does not handle mobile virtual keyboards well. There is no touch-specific UX, and fixed-width elements like `StatsCard` cells (`min-w-[56px]`) will overflow on narrow screens.

**Theme toggle is dead code**
`useTheme.ts` implements a dark/light toggle with `localStorage` persistence, but it is never called from any component. The hook is unused dead code.

**`Suspense` boundary has no fallback**
In `page.tsx`, `<Suspense>` wraps the `Leaderboard` but provides no `fallback` prop, so there is no visible loading state while the component mounts.

**Silent errors in `upsertRoundResult`**
The Supabase `upsert` call in `lib/db/results.ts` does not check the response for errors. If the write fails, the error is silently swallowed and the player receives no feedback.

---

## What I Would Add With More Time

### Completed

- ~~**Supabase anonymous auth**~~ replaced localStorage identity with `signInAnonymously()`; session persists via cookie-based JWT
- ~~**RLS policies**~~ `players` table scoped to `auth.uid()`; insert and update restricted to the owning user
- ~~**Atomic `updatePlayerStats`**~~ replaced read-modify-write with a Postgres function (`update_player_stats`) to eliminate the race condition
- ~~**Session token on write endpoints**~~ `/api/typing-update` and `/api/results` now verify `auth.uid() === playerId`; returns 403 on mismatch
- ~~**Input validation on `/api/results`**~~ UUID format, `0 ≤ accuracy ≤ 1`, `0 ≤ wpm ≤ 300`, `boolean finishedTyping` all enforced
- ~~**Stale round-end save**~~ `useRoundResults` reads `wpm`/`accuracy` from refs at call time instead of capturing stale closure values
- ~~**Accuracy default**~~ `useTypingEngine` now initialises accuracy to `0` instead of `1`; no more phantom 100% before first keystroke
- ~~**Countdown hardcoded to 60s**~~ progress bar derives `totalSeconds` from `round.startedAt`/`round.endsAt`
- ~~**`Suspense` fallback**~~ `LeaderboardSkeleton` provided as fallback to the `<Suspense>` wrapping `Leaderboard`
- ~~**StatsCard staleness**~~ `refreshPlayer()` is called via `onSaved` callback after each round result saves
- ~~**Wire up `useTheme`**~~ dark/light toggle button added to homepage and game page header
- ~~**Disconnect detection**~~ presence channels fire `pusher:member_removed` on tab close; stale players removed immediately
- ~~**Single-session enforcement**~~ `pusher:subscription_succeeded` detects the same `user_id` already present in the channel and warns via toast
- ~~**Presence channels**~~ subscribed to `presence-round-{id}`; Pusher auth endpoint at `/api/pusher/auth` signs each subscription with `auth.uid()` and username
- ~~**`ORDER BY RANDOM() LIMIT 1`**~~ replaced full table scan with a Postgres RPC `get_random_sentence_id()`
- ~~**Mobile / responsive support**~~ typing input uses `opacity:0` positioning instead of `clip`-based `sr-only`; `inputMode="text"` and `onTouchEnd` focus for virtual keyboards; leaderboard table is horizontally scrollable
- ~~**Historical leaderboard**~~ `/history` page (server component) shows past rounds with sentence, timestamp, and per-round results; paginated 8 per page
- ~~**Logout**~~ sign-out button calls `supabase.auth.signOut()` and clears Zustand player state
- ~~**Lobby / homepage**~~ dedicated `/` page with stats card, Enter Game Room, Watch as Spectator, and Race History actions; game moved to `/game`

### Still To Do

- **Caching layer** — hot reads (current round, sentences, player profiles) hit Supabase on every request; short-TTL caching via `unstable_cache` or Upstash Redis would reduce latency and DB load
- **Rate limiting** — no per-IP or per-user limits on any API route; add via Upstash Ratelimit or Vercel Edge middleware
- **Monitoring & observability** — no structured logging or error tracking; add Sentry for client/server errors, Pino for server logs, and Vercel Analytics or Datadog for APM
- **Playwright E2E tests** — no integration coverage; a full join → type → finish → leaderboard flow across two browser sessions would catch regressions the unit tests miss
- **CI/CD pipeline** — no automated checks on PRs; GitHub Actions running `tsc --noEmit`, ESLint, and `vitest run` would prevent broken code from reaching `main`
- **Cron in local dev** — Vercel Cron is cloud-only; rounds must be advanced manually; a local `scripts/advance-round.ts` helper or `watch` script would remove the friction

---
