-- Resolved external application URL for postings that originate elsewhere.
-- For LinkedIn jobs this holds the company's own career-site link so the
-- "Apply" button goes straight to the original posting instead of the
-- LinkedIn listing.
alter table public.jobs add column apply_url text;

create index on public.jobs (apply_url);
