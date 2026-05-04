-- Part 3 of 7. Run in order.


create or replace function public.class_login_students(class_code text)
returns table(id uuid, name text, avatar text, locked boolean, username text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.avatar, p.locked, p.username
  from public.profiles p
  join public.classes c on c.id = p.class_id
  where lower(c.code) = lower(trim(class_code))
    and p.role = 'student'
    and p.locked = false
  order by p.name
$$;


grant execute on function public.class_login_students(text) to anon, authenticated;


drop policy if exists "classes_select_own_teacher_or_admin" on public.classes;

drop policy if exists "classes_admin_insert" on public.classes;

drop policy if exists "classes_teacher_update_own_or_admin" on public.classes;

drop policy if exists "profiles_select_own_or_class" on public.profiles;

drop policy if exists "profiles_insert_own" on public.profiles;

drop policy if exists "profiles_update_own_limited" on public.profiles;

drop policy if exists "profiles_teacher_manage_class" on public.profiles;

drop policy if exists "stats_select_own_or_class" on public.game_stats;

drop policy if exists "stats_insert_own" on public.game_stats;

drop policy if exists "stats_update_own_or_teacher" on public.game_stats;

drop policy if exists "cards_select_own_or_teacher_class" on public.cards;

drop policy if exists "cards_insert_own_or_teacher_class" on public.cards;

drop policy if exists "cards_update_own_or_teacher_class" on public.cards;

drop policy if exists "decks_select_own_or_teacher_class" on public.decks;

drop policy if exists "decks_upsert_own" on public.decks;

drop policy if exists "drawings_select_own_or_teacher_class" on public.drawings;

drop policy if exists "drawings_insert_own" on public.drawings;

drop policy if exists "storage_drawings_read_authenticated" on storage.objects;

drop policy if exists "storage_drawings_write_own_folder" on storage.objects;

drop policy if exists "storage_cards_read_authenticated" on storage.objects;

drop policy if exists "storage_cards_write_teacher_or_own_folder" on storage.objects;

drop policy if exists "storage_avatars_read_authenticated" on storage.objects;

drop policy if exists "storage_avatars_write_own_folder" on storage.objects;
