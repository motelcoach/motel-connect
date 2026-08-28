-- Motel Connect v2 — first backend slice.
-- Run this in the Supabase SQL editor. The waitlist is live; other tables come next.

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

-- No anon policies. Inserts and admin reads go through the Next.js API
-- with the service role key, which bypasses RLS.
