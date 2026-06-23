-- ============================================================================
-- Mentors HQ — Phase 1 Stage B: cadence features
-- Tasks, reports + media (Log work), cadence check-ins, announcements, kudos,
-- and a private Storage bucket. Apply AFTER 0001_phase1.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin create type public.task_status   as enum ('todo','in_progress','submitted','done','blocked'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_priority as enum ('low','medium','high','urgent'); exception when duplicate_object then null; end $$;
do $$ begin create type public.handoff_stage as enum ('capture','produce','publish','engage','convert','report'); exception when duplicate_object then null; end $$;
do $$ begin create type public.report_type   as enum ('daily_update','output','weekly_win','extra_mile'); exception when duplicate_object then null; end $$;
do $$ begin create type public.media_kind    as enum ('image','video','document'); exception when duplicate_object then null; end $$;
do $$ begin create type public.cadence_type  as enum ('huddle','weekly'); exception when duplicate_object then null; end $$;
do $$ begin create type public.audience_kind as enum ('all','role','brand','individual'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helper: caller's role (SECURITY DEFINER avoids RLS recursion).
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  assignee_id   uuid references public.profiles(id) on delete set null,
  assigner_id   uuid references public.profiles(id) on delete set null,
  status        public.task_status not null default 'todo',
  priority      public.task_priority not null default 'medium',
  due_date      date,
  handoff_stage public.handoff_stage,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create table if not exists public.task_brands (
  task_id  uuid not null references public.tasks(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  primary key (task_id, brand_id)
);

create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_status   on public.tasks(status);
create index if not exists idx_task_brands_brand on public.task_brands(brand_id);

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reports ("Log work") + media + brand tags + kudos
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       public.report_type not null default 'daily_update',
  body       text not null default '',
  link       text,
  task_id    uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.report_media (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  file_path  text not null,                -- path within the 'work-media' bucket
  kind       public.media_kind not null default 'image',
  created_at timestamptz not null default now()
);

create table if not exists public.report_brands (
  report_id uuid not null references public.reports(id) on delete cascade,
  brand_id  uuid not null references public.brands(id) on delete cascade,
  primary key (report_id, brand_id)
);

create table if not exists public.report_kudos (
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index if not exists idx_reports_user on public.reports(user_id);
create index if not exists idx_reports_type on public.reports(type);
create index if not exists idx_report_media_report on public.report_media(report_id);

-- ---------------------------------------------------------------------------
-- Cadence check-ins (daily huddle / weekly wins)
-- content jsonb: huddle => {shipped, shipping, blockers}; weekly => {win, learning, ask}
-- ---------------------------------------------------------------------------
create table if not exists public.cadence_checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       public.cadence_type not null,
  period     date not null default current_date,
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type, period)
);

create index if not exists idx_cadence_period on public.cadence_checkins(period);

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references public.profiles(id) on delete set null,
  title          text not null,
  body           text not null default '',
  audience       public.audience_kind not null default 'all',
  audience_role  public.user_role,                 -- when audience='role'
  brand_id       uuid references public.brands(id) on delete cascade, -- when audience='brand'
  target_user_id uuid references public.profiles(id) on delete cascade, -- when audience='individual'
  pinned         boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_announcements_pinned on public.announcements(pinned, created_at desc);

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.tasks            enable row level security;
alter table public.task_brands      enable row level security;
alter table public.reports          enable row level security;
alter table public.report_media     enable row level security;
alter table public.report_brands    enable row level security;
alter table public.report_kudos     enable row level security;
alter table public.cadence_checkins enable row level security;
alter table public.announcements    enable row level security;

-- tasks: assignee or manager can read; managers create/assign; assignee or
-- manager can update (status); managers delete.
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
  using (assignee_id = auth.uid() or assigner_id = auth.uid() or public.is_manager());
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.is_manager());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (assignee_id = auth.uid() or public.is_manager())
  with check (assignee_id = auth.uid() or public.is_manager());
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.is_manager());

-- task_brands: visible if the parent task is visible; managers write.
drop policy if exists task_brands_read on public.task_brands;
create policy task_brands_read on public.task_brands for select to authenticated
  using (exists (
    select 1 from public.tasks t where t.id = task_id
      and (t.assignee_id = auth.uid() or t.assigner_id = auth.uid() or public.is_manager())
  ));
drop policy if exists task_brands_write on public.task_brands;
create policy task_brands_write on public.task_brands for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- reports: own or manager read; users insert their own; own or manager edit/delete.
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update to authenticated
  using (user_id = auth.uid() or public.is_manager()) with check (user_id = auth.uid() or public.is_manager());
drop policy if exists reports_delete on public.reports;
create policy reports_delete on public.reports for delete to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- report_media / report_brands: follow the parent report's visibility.
drop policy if exists report_media_read on public.report_media;
create policy report_media_read on public.report_media for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_manager())));
drop policy if exists report_media_write on public.report_media;
create policy report_media_write on public.report_media for all to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_manager())))
  with check (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

drop policy if exists report_brands_read on public.report_brands;
create policy report_brands_read on public.report_brands for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_manager())));
drop policy if exists report_brands_write on public.report_brands;
create policy report_brands_write on public.report_brands for all to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

-- kudos: managers give kudos; visible to managers + the report owner.
drop policy if exists report_kudos_read on public.report_kudos;
create policy report_kudos_read on public.report_kudos for select to authenticated
  using (public.is_manager() or exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));
drop policy if exists report_kudos_write on public.report_kudos;
create policy report_kudos_write on public.report_kudos for all to authenticated
  using (public.is_manager() and user_id = auth.uid())
  with check (public.is_manager() and user_id = auth.uid());

-- cadence: own read/write; managers read all (digest).
drop policy if exists cadence_read on public.cadence_checkins;
create policy cadence_read on public.cadence_checkins for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
drop policy if exists cadence_insert on public.cadence_checkins;
create policy cadence_insert on public.cadence_checkins for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists cadence_update on public.cadence_checkins;
create policy cadence_update on public.cadence_checkins for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- announcements: managers manage; everyone reads what's targeted to them.
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select to authenticated
  using (
    public.is_manager()
    or audience = 'all'
    or (audience = 'role' and audience_role = public.my_role())
    or (audience = 'individual' and target_user_id = auth.uid())
    or (audience = 'brand' and exists (
      select 1 from public.user_brand_coverage c
      where c.user_id = auth.uid() and c.brand_id = announcements.brand_id
    ))
  );
drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- ---------------------------------------------------------------------------
-- Storage: private 'work-media' bucket for Log work uploads.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('work-media', 'work-media', false)
on conflict (id) do nothing;

-- Files are stored under a per-user folder: "<auth.uid()>/<report>/<file>".
drop policy if exists work_media_insert on storage.objects;
create policy work_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'work-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists work_media_select on storage.objects;
create policy work_media_select on storage.objects for select to authenticated
  using (bucket_id = 'work-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager()));

drop policy if exists work_media_delete on storage.objects;
create policy work_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'work-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager()));
