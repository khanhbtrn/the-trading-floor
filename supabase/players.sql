-- Run in Supabase SQL editor before enabling player persistence.
create table if not exists public.players (
  id text primary key,
  rank text not null,
  career_pnl numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;

-- Service role bypasses RLS; anon clients need a policy if called from browser.
create policy "players service upsert"
  on public.players
  for all
  using (true)
  with check (true);
