-- PesaPlan cloud sync schema
-- Run this in your Supabase SQL editor or via `supabase db push`

-- Each anonymous user gets one row containing their full app state as JSON.
-- This is intentionally simple: no normalization, no per-table queries.
-- All filtering/querying happens client-side (matching the existing architecture).

create table if not exists public.user_data (
  user_id   uuid primary key,
  state     jsonb  not null,
  updated_at timestamptz not null default now()
);

-- Row-level security: every user can only read/write their own row
alter table public.user_data enable row level security;

create policy "Users can insert their own row"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own row"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can update their own row"
  on public.user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own row"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_data_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();
