-- Part 2 of 7. Run in order.


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
