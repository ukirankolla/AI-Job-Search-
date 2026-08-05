-- Manual jobs added through the app's "Add job" form can be deleted by any
-- signed-in user. Feed/sample jobs are shared across everyone, so they stay
-- protected and cannot be removed.
create policy "authenticated can delete manual jobs"
  on public.jobs for delete
  using (auth.role() = 'authenticated' and source = 'manual');
