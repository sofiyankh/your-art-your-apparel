create policy "designs upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "designs read own" on storage.objects for select to authenticated
  using (bucket_id = 'designs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "designs update own" on storage.objects for update to authenticated
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "designs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);