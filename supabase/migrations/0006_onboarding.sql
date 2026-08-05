-- Onboarding: contact details collected when a new user signs up.
alter table public.profiles
  add column email text not null default '',
  add column phone text not null default '',
  add column country text not null default '',
  add column city text not null default '',
  add column linkedin_url text not null default '',
  add column github_url text not null default '',
  add column website_url text not null default '',
  add column onboarding_completed boolean not null default false;
