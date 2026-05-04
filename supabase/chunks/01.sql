-- Part 1 of 7. Run in order.

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
