create table sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  total_races int not null default 0,
  best_wpm int not null default 0,
  avg_accuracy float not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  sentence_id uuid not null references sentences(id),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz default now()
);

create table round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  player_id uuid not null references players(id),
  wpm int not null default 0,
  accuracy float not null default 0,
  finished_typing boolean not null default false,
  position int,
  created_at timestamptz default now(),
  unique(round_id, player_id)
);

create index idx_rounds_status on rounds(status);
create index idx_round_results_round_id on round_results(round_id);

alter table sentences enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table round_results enable row level security;

create policy "public read sentences" on sentences for select using (true);
create policy "public read rounds" on rounds for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read results" on round_results for select using (true);
create policy "public insert players" on players for insert with check (true);
create policy "public update players" on players for update using (true);
create policy "public insert results" on round_results for insert with check (true);
create policy "public update results" on round_results for update using (true);
create policy "public insert rounds" on rounds for insert with check (true);
create policy "public update rounds" on rounds for update using (true);
