-- AI Job Search — initial schema
-- Requires the pgvector extension for resume RAG embeddings.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Profiles — one per authenticated user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  title text not null default '',
  summary text not null default '',
  skills text[] not null default '{}',
  resume_text text not null default '',
  resume_embedding_status text not null default 'none', -- none | pending | done | failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- profile_chunks — vectorized fragments of the resume for RAG
-- ---------------------------------------------------------------------------
create table public.profile_chunks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null, -- summary | experience | skill | education | project
  content text not null,
  source_label text not null default '',
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.profile_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index on public.profile_chunks (profile_id);

alter table public.profile_chunks enable row level security;

create policy "users can read own chunks"
  on public.profile_chunks for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid()));

create policy "users can manage own chunks"
  on public.profile_chunks for all
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid()));

-- ---------------------------------------------------------------------------
-- jobs — unified feed of job postings (manual, CSV, JSON feed)
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual', -- manual | feed | csv | sample
  external_id text,
  title text not null,
  company text not null default '',
  location text not null default '',
  description text not null default '',
  url text not null default '',
  salary_min int,
  salary_max int,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  unique (source, external_id)
);

create index on public.jobs (title);
create index on public.jobs (company);

alter table public.jobs enable row level security;

create policy "anyone can read jobs"
  on public.jobs for select using (true);

create policy "authenticated can insert jobs"
  on public.jobs for insert with check (auth.role() = 'authenticated');

create policy "authenticated can update jobs"
  on public.jobs for update using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- applications — the user's pipeline
-- ---------------------------------------------------------------------------
create type public.application_status as enum (
  'saved', 'applied', 'interviewing', 'offer', 'rejected'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  status public.application_status not null default 'saved',
  match_score int, -- 0-100 from the matcher agent
  match_reason text not null default '',
  custom_title text not null default '',
  custom_company text not null default '',
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.applications (user_id, status);
create index on public.applications (deadline);

alter table public.applications enable row level security;

create policy "users can manage own applications"
  on public.applications for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tailored_documents — agent-generated resume/cover letter per application
-- ---------------------------------------------------------------------------
create table public.tailored_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  doc_type text not null check (doc_type in ('resume', 'cover_letter')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.tailored_documents enable row level security;

create policy "users can manage own tailored docs"
  on public.tailored_documents for all
  using (exists (
    select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- interview_preps — agent-generated questions/answers for a role
-- ---------------------------------------------------------------------------
create table public.interview_preps (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.interview_preps enable row level security;

create policy "users can manage own interview preps"
  on public.interview_preps for all
  using (exists (
    select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- notifications — generated by the tracker agent
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- deadline | follow_up | milestone | agent_run
  title text not null,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id, read);

alter table public.notifications enable row level security;

create policy "users can manage own notifications"
  on public.notifications for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- agent_runs — auditable trace of multi-agent orchestration (great for demo)
-- ---------------------------------------------------------------------------
create type public.run_status as enum ('running', 'completed', 'failed');

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_type text not null, -- analyze | apply | prep
  application_id uuid references public.applications(id) on delete set null,
  status public.run_status not null default 'running',
  steps jsonb not null default '[]'::jsonb, -- [{agent, status, output, ts}]
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_runs enable row level security;

create policy "users can manage own agent runs"
  on public.agent_runs for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function public.touch_updated_at();

create trigger agent_runs_touch_updated_at
  before update on public.agent_runs
  for each row execute function public.touch_updated_at();
