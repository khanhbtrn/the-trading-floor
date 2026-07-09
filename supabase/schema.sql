-- Career Edition schema — run once in Supabase SQL editor.

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  rank text default 'Junior Trader',
  career_pnl numeric default 0,
  sessions_played integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id),
  scenario_id text not null,
  session_pnl numeric not null,
  conduct_score integer not null,
  final_rank text not null,
  created_at timestamp default now()
);

alter table public.players enable row level security;
alter table public.games enable row level security;

create policy "players read all"
  on public.players for select using (true);

create policy "players insert anon"
  on public.players for insert with check (true);

create policy "players update all"
  on public.players for update using (true);

create policy "games insert anon"
  on public.games for insert with check (true);

create policy "games read all"
  on public.games for select using (true);
