-- Job attributes used by the feed filters:
--   employment_type : w2 | c2c | full_time | internship (null = unknown)
--   sponsorship     : yes | no (null = unknown)
alter table public.jobs
  add column employment_type text,
  add column sponsorship text;

create index on public.jobs (employment_type);
create index on public.jobs (sponsorship);
