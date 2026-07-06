-- ============================================================================
-- Mentors HQ — Phase 2 Stage A: Board of Directors RLS (part 2)
-- Apply AFTER 0003_board_role.sql (enum value must already be committed).
-- Extends SELECT-only policies so board_director can view team-wide
-- activity/tasks/announcements/cadence. Write access is untouched — board
-- never gets insert/update/delete on anything.
-- ============================================================================

create or replace function public.is_board()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'board_director');
$$;

-- profiles: board can read the roster (needed to label who's who in feeds).
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_manager() or public.is_board());

-- user_brand_coverage: board can read for context.
drop policy if exists coverage_read on public.user_brand_coverage;
create policy coverage_read on public.user_brand_coverage
  for select to authenticated
  using (user_id = auth.uid() or public.is_manager() or public.is_board());

-- tasks: board sees all tasks (read-only).
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
  using (assignee_id = auth.uid() or assigner_id = auth.uid() or public.is_manager() or public.is_board());

drop policy if exists task_brands_read on public.task_brands;
create policy task_brands_read on public.task_brands for select to authenticated
  using (exists (
    select 1 from public.tasks t where t.id = task_id
      and (t.assignee_id = auth.uid() or t.assigner_id = auth.uid() or public.is_manager() or public.is_board())
  ));

-- reports ("Log work" / weekly team progress activity): board reads all.
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select to authenticated
  using (user_id = auth.uid() or public.is_manager() or public.is_board());

drop policy if exists report_media_read on public.report_media;
create policy report_media_read on public.report_media for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_manager() or public.is_board())));

drop policy if exists report_brands_read on public.report_brands;
create policy report_brands_read on public.report_brands for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_manager() or public.is_board())));

drop policy if exists report_kudos_read on public.report_kudos;
create policy report_kudos_read on public.report_kudos for select to authenticated
  using (public.is_manager() or public.is_board() or exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

-- cadence check-ins (huddle/weekly wins): board reads the team digest.
drop policy if exists cadence_read on public.cadence_checkins;
create policy cadence_read on public.cadence_checkins for select to authenticated
  using (user_id = auth.uid() or public.is_manager() or public.is_board());

-- announcements: board sees everything, regardless of targeting.
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select to authenticated
  using (
    public.is_manager()
    or public.is_board()
    or audience = 'all'
    or (audience = 'role' and audience_role = public.my_role())
    or (audience = 'individual' and target_user_id = auth.uid())
    or (audience = 'brand' and exists (
      select 1 from public.user_brand_coverage c
      where c.user_id = auth.uid() and c.brand_id = announcements.brand_id
    ))
  );

-- work-media storage: board can view attached evidence in the activity feed.
drop policy if exists work_media_select on storage.objects;
create policy work_media_select on storage.objects for select to authenticated
  using (bucket_id = 'work-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager() or public.is_board()));
