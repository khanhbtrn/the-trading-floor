-- Migration: add intro_completed for first-session onboarding
alter table public.players
  add column if not exists intro_completed boolean default false;

-- Existing players who already played skip the intro
update public.players
set intro_completed = true
where sessions_played > 0;
