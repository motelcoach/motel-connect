-- Motel Connect v2 — waitlist, manager roster, owners, and admin login.
-- Run this in the Supabase SQL editor. Safe to re-run.
-- After Auth is enabled, add these Redirect URLs under Authentication → URL configuration:
--   http://localhost:3001/auth/callback
--   https://motelconnect.com.au/auth/callback

create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  interest text not null check (interest in ('owner', 'manager')),
  invite_code text not null,
  referred_by text,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_lower
  on public.waitlist (lower(email));

create unique index if not exists waitlist_invite_code
  on public.waitlist (invite_code);

alter table public.waitlist enable row level security;

-- Manager roster. Everyone who joins lands as open (Non-vetted).
-- Premium is earned: two vetted owner references, or an admin pass.

create table if not exists public.managers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  phone text,
  location text,
  state text,
  basket text not null default 'open' check (basket in ('premium', 'open')),
  verified_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists managers_email_lower
  on public.managers (lower(email));

alter table public.managers enable row level security;

-- Anyone already on the manager waitlist lands on the open roster.
insert into public.managers (email, name, basket)
select
  lower(email),
  initcap(replace(split_part(email, '@', 1), '.', ' ')),
  'open'
from public.waitlist
where interest = 'manager'
on conflict (email) do nothing;

-- Invite-only owners. admitted = true means they can log in.
create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  motel_name text,
  phone text,
  location text,
  state text,
  admitted boolean not null default false,
  admitted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists owners_email_lower
  on public.owners (lower(email));

alter table public.owners enable row level security;

alter table public.owners
  add column if not exists admitted_at timestamptz;

insert into public.owners (email, name, admitted)
select
  lower(email),
  initcap(replace(split_part(email, '@', 1), '.', ' ')),
  false
from public.waitlist
where interest = 'owner'
on conflict (email) do nothing;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default 'Admin',
  created_at timestamptz not null default now()
);

create unique index if not exists admins_email_lower
  on public.admins (lower(email));

alter table public.admins enable row level security;

insert into public.admins (email, name)
values ('alex.rivera@motelconnect.com.au', 'Alex Rivera')
on conflict (email) do nothing;
