-- Run this once in Supabase SQL Editor.
create table if not exists public.daily_entries (
  date date primary key,
  sales numeric default 0,
  orders integer default 0,
  units integer default 0,
  production integer default 0,
  raw numeric default 0,
  raw_cost numeric default 0,
  pack numeric default 0,
  labour numeric default 0,
  other numeric default 0,
  expenses numeric default 0,
  profit numeric default 0,
  stock integer default 0,
  recv numeric default 0,
  pay numeric default 0,
  damaged integer default 0,
  product text
);

alter table public.daily_entries enable row level security;

-- For a private single-owner app, use Supabase Auth and replace this
-- policy with an authenticated-user policy before production use.
-- This demo policy is intentionally NOT enabled automatically.
