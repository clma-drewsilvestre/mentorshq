-- ============================================================================
-- Mentors HQ — Phase 2 Stage A: Board of Directors (read-only governance role)
-- Adds the enum value first (own transaction), then a second block extends
-- SELECT-only policies so board_director can view team-wide data without
-- ever gaining write access. Apply AFTER 0002_cadence.sql.
-- ============================================================================

alter type public.user_role add value if not exists 'board_director';
