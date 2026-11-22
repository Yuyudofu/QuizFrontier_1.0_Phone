-- Qu1zFr0ntier cloud sync for Supabase
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.quiz_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.quiz_data enable row level security;

drop policy if exists "users can read their own quiz data" on public.quiz_data;
create policy "users can read their own quiz data"
  on public.quiz_data for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert their own quiz data" on public.quiz_data;
create policy "users can insert their own quiz data"
  on public.quiz_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update their own quiz data" on public.quiz_data;
create policy "users can update their own quiz data"
  on public.quiz_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own quiz data" on public.quiz_data;
create policy "users can delete their own quiz data"
  on public.quiz_data for delete
  using (auth.uid() = user_id);

create or replace function public.set_quiz_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quiz_data_updated_at on public.quiz_data;
create trigger quiz_data_updated_at
before update on public.quiz_data
for each row execute function public.set_quiz_data_updated_at();
