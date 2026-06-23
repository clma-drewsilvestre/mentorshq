# Mentors HQ — Engineering Conventions (CLAUDE.md)

Mobile-first PWA — the people & incentive operating system for **MILE, Inc.** (brands: Mentors café, CLMA school, FNN media, founder Personal). Full product spec: see [SPEC.md](./SPEC.md). Current stage: **Phase 1 (MVP)**.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind v4** + **shadcn/ui** (style: base-nova).
- **Supabase** (Postgres + Auth + Storage + RLS). Cloud project.
- Installable **PWA** (manifest + service worker, prod-only registration).

## ⚠️ Next.js 16 gotchas (differ from older training data)
- **`middleware.ts` is renamed to `proxy.ts`** (Node.js runtime by default). Session refresh lives in [proxy.ts](./proxy.ts).
- **`cookies()`, `headers()`, `params`, `searchParams` are async** — always `await` them.
- Proxy can be skipped for Server Functions on excluded paths → **always re-check auth inside server components / server actions**, never rely on proxy alone (see SPEC §8).
- Bundled docs live in `node_modules/next/dist/docs/` — consult before using an unfamiliar API.

## Conventions
- **Path alias:** `@/*` → repo root. No `src/` dir.
- **Routes:** App Router groups — `app/(auth)/...` (public), `app/(app)/...` (authenticated shell). Server Components by default; add `"use client"` only when needed.
- **Supabase clients:** `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (RSC/actions, async), `lib/supabase/admin.ts` (service-role, **server-only**, never imported into a client component).
- **Mutations:** prefer server actions; validate input and re-check role/auth server-side.
- **Brand tagging is first-class.** Tasks, reports, content, announcements carry brand tags. Brand slugs: `mentors | clma | fnn | personal`.
- **Roles:** `founder | ops_manager | cafe_ambassador | media_producer | learning_officer`. `founder`/`ops_manager` are management.
- **Money:** Philippine pesos (₱). Store amounts as integers (centavos) or `numeric` — never floats.
- **UI:** dark cinematic shell (Obsidian/Gold/Copper/Bone). Display type = Cormorant Garamond (`font-display`), UI = Montserrat (`font-sans`). Thumb-reachable, bottom-nav.

## Security (RA 10173 mindset)
- RLS is the source of truth for "who sees what." Employees read only their own sensitive rows; founder/ops read team rows.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is used **only** in `lib/supabase/admin.ts` server routes (e.g. invites). Never ship it to the client.
- Storage media bucket is private; serve via signed URLs.
- Audit-log changes to pay, scores, profit-share, and visibility.

## Env vars (`.env.local`, not committed)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key (server only)
- `APP_LAUNCH_DATE` — ISO date; hires before it auto-flag as founding team
- See [.env.example](./.env.example) for the template.

## Setup
```bash
npm install
cp .env.example .env.local   # then fill in Supabase keys
# Apply DB schema: run supabase/migrations/*.sql in the Supabase SQL editor (or via the Supabase CLI)
npm run dev
```

## Database
- Migrations: `supabase/migrations/NNNN_name.sql`. Apply in order. Each migration is idempotent where practical.
- Seeded: 4 brands (Mentors/CLMA/FNN/Personal). First founder is bootstrapped via SQL or the invite flow.

## Phase boundaries
Phase 1 ships auth+RLS, brands+tagging, brand-aware home, tasks, "Log work" uploads, cadence, announcements, PWA shell. Scorecard/KPI/incentives/payroll/profit-share are **Phase 2/3** — schema is shaped to accept them but not built yet.
