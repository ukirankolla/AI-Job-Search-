-- Resume file metadata: remember which file the user uploaded so the profile
-- page can show it back to them (name + size). The extracted text lives in
-- resume_text; the original file is not stored.
alter table public.profiles
  add column resume_filename text not null default '',
  add column resume_file_size bigint not null default 0;
