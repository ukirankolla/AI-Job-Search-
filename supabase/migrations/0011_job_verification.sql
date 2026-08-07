-- Verifier agent verdict for each posting: whether it is confirmed to live on
-- the company's own career site. "verified" = a company-owned apply URL was
-- found; "likely" = the company career site was resolved but the exact posting
-- is not confirmed; "unverified" = no company-owned source was found.
alter table public.jobs add column verified_status text;
alter table public.jobs add column verified_at timestamptz;
alter table public.jobs add column verified_source_url text;

create index on public.jobs (verified_status);
