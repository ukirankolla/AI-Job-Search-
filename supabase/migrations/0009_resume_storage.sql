-- Resume document storage: keep the original uploaded file so the profile page
-- can open the exact resume the user applied with, instead of only the
-- extracted text.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Files are stored under <user_id>/<filename> so ownership is scoped to the
-- authenticated user via Row Level Security.
create policy "resume_read_own" on storage.objects
  for select using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resume_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resume_update_own" on storage.objects
  for update using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resume_delete_own" on storage.objects
  for delete using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

alter table public.profiles
  add column resume_file_path text not null default '';
