-- Per-user match results for every job shown in the feed. Lets the app show a
-- match percentage for each posting (matched or not) without re-running the
-- Matcher agent on every page view.
create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  score integer not null,
  summary text not null default '',
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  strengths text[] not null default '{}',
  concerns text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index on public.job_matches (user_id);
create index on public.job_matches (job_id);

alter table public.job_matches enable row level security;

create policy "users can manage own job matches"
  on public.job_matches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
