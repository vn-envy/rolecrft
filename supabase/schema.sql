-- Rolecrft core schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  headline text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  role_title text not null,
  company_name text not null,
  role_url text,
  stage text not null default 'research',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.candidate_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.role_workspaces(id) on delete cascade,
  source_type text not null,
  source_label text,
  source_url text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.candidate_intelligence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  resume_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, workspace_id)
);

create table if not exists public.role_intelligence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  role_summary text,
  hard_requirements jsonb not null default '[]'::jsonb,
  soft_requirements jsonb not null default '[]'::jsonb,
  company_signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, workspace_id)
);

create table if not exists public.match_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  verdict text,
  rationale jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.role_workspaces(id) on delete cascade,
  note text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null,
  period_start date not null,
  quantity integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, metric, period_start)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.role_workspaces enable row level security;
alter table public.candidate_sources enable row level security;
alter table public.candidate_intelligence enable row level security;
alter table public.role_intelligence enable row level security;
alter table public.match_analyses enable row level security;
alter table public.artifacts enable row level security;
alter table public.workspace_events enable row level security;
alter table public.workspace_notes enable row level security;
alter table public.usage_counters enable row level security;

create policy "profiles owner can read" on public.profiles for select using (auth.uid() = id);
create policy "profiles owner can update" on public.profiles for update using (auth.uid() = id);

create policy "role_workspaces owner all" on public.role_workspaces
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "candidate_sources owner all" on public.candidate_sources
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "candidate_intelligence owner all" on public.candidate_intelligence
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "role_intelligence owner all" on public.role_intelligence
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "match_analyses owner all" on public.match_analyses
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "artifacts owner all" on public.artifacts
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "workspace_events owner all" on public.workspace_events
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "workspace_notes owner all" on public.workspace_notes
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "usage_counters owner all" on public.usage_counters
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
