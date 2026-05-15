drop table if exists public.stage_history cascade;
drop table if exists public.stage_overrides cascade;
drop table if exists public.tasks cascade;
drop table if exists public.followups cascade;
drop table if exists public.customers cascade;

create table public.customers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  contact text not null,
  title text,
  owner text not null,
  industry text,
  stage text not null default '初步接触',
  deal_value integer not null default 0,
  probability integer not null default 0,
  last_contact_days integer not null default 0,
  expected_close_days integer not null default 30,
  pain_points text[] not null default '{}',
  objections text[] not null default '{}',
  signals text[] not null default '{}',
  activities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.followups (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  content text not null,
  sentiment text not null default 'neutral',
  next_step text,
  due_text text,
  blockers text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  title text not null,
  due_text text,
  priority text not null default 'P2',
  status text not null default 'open',
  source_followup_id text references public.followups(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.stage_overrides (
  customer_id text primary key references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null,
  previous_stage text,
  reason text,
  confirmed_at timestamptz not null default now()
);

create table public.stage_history (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  reason text,
  source_followup_id text references public.followups(id) on delete set null,
  confirmed_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.followups enable row level security;
alter table public.tasks enable row level security;
alter table public.stage_overrides enable row level security;
alter table public.stage_history enable row level security;

create policy "Customers are user scoped" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Followups are user scoped" on public.followups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Tasks are user scoped" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Stage overrides are user scoped" on public.stage_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Stage history is user scoped" on public.stage_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
