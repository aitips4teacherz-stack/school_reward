-- Part 7 of 7. Run in order.


create policy "storage_cards_write_teacher_or_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'cards'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      public.current_profile_role() in ('teacher', 'admin')
      and public.same_class(((storage.foldername(name))[1])::uuid)
    )
  )
);


create policy "storage_avatars_read_authenticated"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      public.current_profile_role() in ('teacher', 'admin')
      and public.same_class(((storage.foldername(name))[1])::uuid)
    )
  )
);


create policy "storage_avatars_write_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
