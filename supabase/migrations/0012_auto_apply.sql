-- Auto-apply: per-user pilot settings, submission tracking on applications,
-- and a run log for the scheduled batch processor.

-- ---------------------------------------------------------------------------
-- auto_apply_settings — the user's auto-pilot preferences
-- ---------------------------------------------------------------------------
create table public.auto_apply_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  min_score int not null default 75 check (min_score between 0 and 100),
  max_per_day int not null default 5 check (max_per_day between 1 and 100),
  hours_lookback int not null default 24 check (hours_lookback between 1 and 168),
  include_locations text[] not null default '{}',
  exclude_companies text[] not null default '{}',
  email_submit boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auto_apply_settings enable row level security;

create policy "users can manage own auto apply settings"
  on public.auto_apply_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- applications — mark how an application was created and its submission state
-- ---------------------------------------------------------------------------
alter table public.applications
  add column origin text not null default 'manual'
    check (origin in ('manual', 'auto')),
  add column auto_status text
    check (auto_status in ('queued', 'ready', 'submitted', 'failed')),
  add column auto_error text,
  add column submitted_at timestamptz;

create index on public.applications (origin, auto_status);
create index on public.applications (user_id, created_at);

-- ---------------------------------------------------------------------------
-- auto_apply_log — per-run summary for the "recent activity" panel
-- ---------------------------------------------------------------------------
create table public.auto_apply_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ran_at timestamptz not null default now(),
  considered int not null default 0,
  matched int not null default 0,
  queued int not null default 0,
  submitted int not null default 0,
  ready int not null default 0,
  skipped int not null default 0,
  failed int not null default 0
);

create index on public.auto_apply_log (user_id, ran_at);

alter table public.auto_apply_log enable row level security;

create policy "users can manage own auto apply log"
  on public.auto_apply_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create trigger auto_apply_settings_touch_updated_at
  before update on public.auto_apply_settings
  for each row execute function public.touch_updated_at();
