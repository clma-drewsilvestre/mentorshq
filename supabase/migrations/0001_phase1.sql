-- ============================================================================
-- Mentors HQ — Phase 1 schema + RLS
-- Brands, profiles, brand coverage, audit log, visibility settings.
-- Apply in the Supabase SQL editor (or `supabase db push`). Idempotent-ish.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum (
    'founder', 'ops_manager', 'cafe_ambassador', 'media_producer', 'learning_officer'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coverage_level as enum ('primary', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('invited', 'active', 'suspended');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Brands: Mentors (cafe), CLMA (school), FNN (media), Personal (founder)
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  kind        text not null,                       -- cafe | school | media | personal
  created_at  timestamptz not null default now()
);

-- Profiles mirror auth.users (1:1). Sensitive: base_salary.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null default '',
  email         text not null,
  role          public.user_role not null,
  job_title     text not null,
  level         integer not null default 1,
  base_salary   numeric(12,2) not null default 0,  -- ₱ pesos
  schedule      jsonb not null default '{}'::jsonb, -- { days:[...], start:"09:00", end:"18:00" }
  date_hired    date,
  founding_team boolean not null default false,
  status        public.user_status not null default 'invited',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Brand coverage drives the live Coverage Matrix (5 seats x 4 brands).
create table if not exists public.user_brand_coverage (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  brand_id  uuid not null references public.brands(id) on delete cascade,
  level     public.coverage_level not null default 'support',
  unique (user_id, brand_id)
);

-- Append-only audit trail for sensitive changes (pay, role, visibility).
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,                       -- e.g. 'profile.update', 'invite.create'
  entity      text not null,                       -- e.g. 'profiles'
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

-- Founder-controlled visibility/config (key/value). Stub for §P admin backend.
create table if not exists public.visibility_settings (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null,                        -- 'global' | role | user id
  key        text not null,
  value      jsonb not null default 'true'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (scope, key)
);

create index if not exists idx_coverage_user  on public.user_brand_coverage(user_id);
create index if not exists idx_coverage_brand on public.user_brand_coverage(brand_id);
create index if not exists idx_audit_entity   on public.audit_log(entity, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER bypasses RLS to avoid recursion on
-- profiles policies that need to know the caller's role).
-- ---------------------------------------------------------------------------
create or replace function public.is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'founder');
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('founder', 'ops_manager')
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.brands               enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_brand_coverage  enable row level security;
alter table public.audit_log            enable row level security;
alter table public.visibility_settings  enable row level security;

-- brands: everyone signed in can read; only founder writes.
drop policy if exists brands_read on public.brands;
create policy brands_read on public.brands
  for select to authenticated using (true);
drop policy if exists brands_write on public.brands;
create policy brands_write on public.brands
  for all to authenticated using (public.is_founder()) with check (public.is_founder());

-- profiles: read own row, or any if manager. Only founder may write
-- (prevents employees editing their own salary/role). Invites use the
-- service-role client which bypasses RLS entirely.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_manager());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (public.is_founder());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated using (public.is_founder());

-- coverage: read own or manager; founder writes.
drop policy if exists coverage_read on public.user_brand_coverage;
create policy coverage_read on public.user_brand_coverage
  for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
drop policy if exists coverage_write on public.user_brand_coverage;
create policy coverage_write on public.user_brand_coverage
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

-- audit_log: managers read; any authenticated user may append their own action.
-- No update/delete policy => immutable from the API.
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log
  for select to authenticated using (public.is_manager());
drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
  for insert to authenticated with check (actor_id = auth.uid());

-- visibility_settings: all signed-in read; founder writes.
drop policy if exists visibility_read on public.visibility_settings;
create policy visibility_read on public.visibility_settings
  for select to authenticated using (true);
drop policy if exists visibility_write on public.visibility_settings;
create policy visibility_write on public.visibility_settings
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

-- ---------------------------------------------------------------------------
-- Seed brands
-- ---------------------------------------------------------------------------
insert into public.brands (slug, name, kind) values
  ('mentors',  'Mentors Business Café', 'cafe'),
  ('clma',     'CLMA',                  'school'),
  ('fnn',      'FNN',                   'media'),
  ('personal', 'Personal',              'personal')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Bootstrap the first founder (no one exists to invite them).
-- Usage, ONCE, after the founder has signed up in Supabase Auth:
--     select public.bootstrap_founder('founder@example.com');
-- Locked down: not executable by anon/authenticated, only from the SQL editor
-- (postgres/service role), so nobody can self-promote to founder.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_founder(p_email text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email) limit 1;
  if uid is null then
    raise exception 'No auth user found with email %. Sign up first, then re-run.', p_email;
  end if;
  insert into public.profiles (id, full_name, email, role, job_title, status, date_hired, founding_team, base_salary)
  values (uid, 'Founder', p_email, 'founder', 'Founder & Chief Vision Officer', 'active', current_date, true, 0)
  on conflict (id) do update
    set role = 'founder',
        job_title = 'Founder & Chief Vision Officer',
        status = 'active';
end $$;

revoke execute on function public.bootstrap_founder(text) from public, anon, authenticated;
