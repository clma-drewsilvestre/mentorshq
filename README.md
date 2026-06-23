# Mentors HQ

Mobile-first PWA — the people & incentive operating system for **MILE, Inc.** (brands: Mentors café, CLMA school, FNN media, founder Personal). Phase 1 (MVP).

## Stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Supabase (Postgres + Auth + Storage + RLS) · installable PWA.

## What's in Phase 1
Auth + 5 roles + RLS · brand model & tagging · brand-aware home · tasks (assign, statuses, brand tags) · "Log work" photo/video/doc uploads · daily huddle + weekly wins · announcements · founding-team flag · branded PWA shell.

## Local setup
```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```
Apply DB schema by running `supabase/migrations/*.sql` in order in the Supabase SQL editor, then seat the first founder:
```sql
select public.bootstrap_founder('your-email@example.com');  -- after signing up in Supabase Auth
```

## Environment variables
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret/service-role key — **server only** |
| `APP_LAUNCH_DATE` | ISO date; hires on/before auto-flag as founding team |
| `NEXT_PUBLIC_SITE_URL` | site URL for invite redirect links |

See [SPEC.md](./SPEC.md) for the full product spec and [CLAUDE.md](./CLAUDE.md) for engineering conventions.
