-- Premium subscriptions + weekly usage quotas.
-- Free tier: 15 resume rewrites + 15 in-app applies per rolling 7 days.
-- Premium (or admin) users have no limits.

alter table public.profiles
  add column subscription_tier text not null default 'free';

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('resume_rewrite', 'apply')),
  created_at timestamptz not null default now()
);

create index usage_events_user_kind_created_idx
  on public.usage_events (user_id, kind, created_at desc);

alter table public.usage_events enable row level security;

create policy "users can read own usage"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

create policy "users can insert own usage"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);
