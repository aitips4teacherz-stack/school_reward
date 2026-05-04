-- Part 6 of 7. Run in order.


create or replace function public.create_profile_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.game_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;


drop trigger if exists on_profile_created_stats on public.profiles;

create trigger on_profile_created_stats
after insert on public.profiles
for each row execute procedure public.create_profile_stats();


create or replace function public.apply_battle_result(result text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if result = 'win' then
    update public.game_stats
      set wins = wins + 1, coins = coins + 10
      where user_id = auth.uid();
  elsif result = 'loss' then
    update public.game_stats
      set losses = losses + 1
      where user_id = auth.uid();
  else
    raise exception 'Invalid battle result';
  end if;
end;
$$;


create policy "storage_drawings_read_authenticated"
on storage.objects for select
to authenticated
using (
  bucket_id = 'drawings'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      public.current_profile_role() in ('teacher', 'admin')
      and public.same_class(((storage.foldername(name))[1])::uuid)
    )
  )
);


create policy "storage_drawings_write_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'drawings'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "storage_cards_read_authenticated"
on storage.objects for select
to authenticated
using (
  bucket_id = 'cards'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      public.current_profile_role() in ('teacher', 'admin')
      and public.same_class(((storage.foldername(name))[1])::uuid)
    )
  )
);
