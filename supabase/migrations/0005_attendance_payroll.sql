-- ============================================================================
-- Mentors HQ — Phase 2 Stage A: Attendance + Payroll (MVP slice)
-- Minimal attendance (clock in/out) and payslip records so the founder,
-- ops manager, and Board of Directors have real data to view. Full
-- KPI-driven incentives/statutory tables remain Phase 2/3 per SPEC.md.
-- Apply AFTER 0004_board_rls.sql.
-- ============================================================================

do $$ begin
  create type public.attendance_status as enum ('on_time','late','absent','leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payslip_status as enum ('draft','issued');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  date         date not null default current_date,
  time_in      timestamptz,
  time_out     timestamptz,
  status       public.attendance_status not null default 'on_time',
  late_minutes integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_attendance_user on public.attendance(user_id);
create index if not exists idx_attendance_date on public.attendance(date);

alter table public.attendance enable row level security;

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select to authenticated
  using (user_id = auth.uid() or public.is_manager() or public.is_board());

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance for insert to authenticated
  with check (user_id = auth.uid() or public.is_manager());

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance for update to authenticated
  using (user_id = auth.uid() or public.is_manager())
  with check (user_id = auth.uid() or public.is_manager());

-- ---------------------------------------------------------------------------
-- Payslips (simplified — basic pay, manual deductions, net; no statutory
-- tables or KPI-driven incentives yet, those are Phase 2/3).
-- ---------------------------------------------------------------------------
create table if not exists public.payslips (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  period_start      date not null,
  period_end        date not null,
  basic             numeric(12,2) not null default 0,
  deductions_total  numeric(12,2) not null default 0,
  net               numeric(12,2) not null default 0,
  status            public.payslip_status not null default 'draft',
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  issued_at         timestamptz
);

create index if not exists idx_payslips_user on public.payslips(user_id);
create index if not exists idx_payslips_period on public.payslips(period_start, period_end);

alter table public.payslips enable row level security;

drop policy if exists payslips_read on public.payslips;
create policy payslips_read on public.payslips for select to authenticated
  using (user_id = auth.uid() or public.is_manager() or public.is_board());

-- Only founder/ops prepare payroll (spec: ops "prepares", founder "runs/issues").
-- The founder-only issue transition is enforced in the server action, not RLS.
drop policy if exists payslips_write on public.payslips;
create policy payslips_write on public.payslips for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
