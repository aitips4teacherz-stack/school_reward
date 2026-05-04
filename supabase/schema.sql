create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values
  ('drawings', 'drawings', false),
  ('cards', 'cards', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  class_id uuid,
  username text unique,
  login_email text unique,
  avatar text,
  pin text,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete set null,
  name text not null default 'Classroom',
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists login_email text;
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_login_email_key on public.profiles (login_email);
create unique index if not exists profiles_username_key on public.profiles (username);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_class_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_class_id_fkey
      foreign key (class_id) references public.classes(id) on delete set null;
  end if;
end $$;

create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  wins int not null default 0,
  losses int not null default 0,
  coins int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  image_url text not null,
  rarity text not null check (rarity in ('Common', 'Rare', 'Epic', 'Legendary')),
  color text not null check (color in ('Red', 'Blue', 'Green')),
  attack int not null check (attack between 0 and 100),
  defense int not null check (defense between 0 and 100),
  speed int not null check (speed between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null default 'Main Deck',
  cards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.game_stats enable row level security;
alter table public.cards enable row level security;
alter table public.decks enable row level security;
alter table public.drawings enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_class_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select class_id from public.profiles where id = auth.uid()
$$;

create or replace function public.same_class(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles target
    where target.id = profile_id
      and target.class_id is not distinct from public.current_profile_class_id()
  )
$$;

create or replace function public.class_from_code(class_code text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.classes where lower(code) = lower(trim(class_code))
$$;

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

create policy "classes_select_own_teacher_or_admin"
on public.classes for select
to authenticated
using (
  teacher_id = auth.uid()
  or id is not distinct from public.current_profile_class_id()
  or public.current_profile_role() = 'admin'
);

create policy "classes_admin_insert"
on public.classes for insert
to authenticated
with check (public.current_profile_role() = 'admin');

create policy "classes_teacher_update_own_or_admin"
on public.classes for update
to authenticated
using (teacher_id = auth.uid() or public.current_profile_role() = 'admin')
with check (teacher_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "profiles_select_own_or_class"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (
    public.current_profile_role() = 'teacher'
    and class_id is not distinct from public.current_profile_class_id()
  )
);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own_limited"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_teacher_manage_class"
on public.profiles for update
to authenticated
using (
  public.current_profile_role() in ('teacher', 'admin')
  and class_id is not distinct from public.current_profile_class_id()
)
with check (
  public.current_profile_role() in ('teacher', 'admin')
  and class_id is not distinct from public.current_profile_class_id()
);

create policy "stats_select_own_or_class"
on public.game_stats for select
to authenticated
using (user_id = auth.uid() or public.same_class(user_id) or public.current_profile_role() = 'admin');

create policy "stats_insert_own"
on public.game_stats for insert
to authenticated
with check (user_id = auth.uid());

create policy "stats_update_own_or_teacher"
on public.game_stats for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "cards_select_own_or_teacher_class"
on public.cards for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "cards_insert_own_or_teacher_class"
on public.cards for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "cards_update_own_or_teacher_class"
on public.cards for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "decks_select_own_or_teacher_class"
on public.decks for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "decks_upsert_own"
on public.decks for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "drawings_select_own_or_teacher_class"
on public.drawings for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);

create policy "drawings_insert_own"
on public.drawings for insert
to authenticated
with check (user_id = auth.uid());

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
