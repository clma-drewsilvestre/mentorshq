# Build Prompt v2 — "Mentors HQ" · Multi-Brand People & Incentive Operating System
**Owner: MILE, Inc. — Mentors Business Café (Mentors) · CLMA (School) · FNN (Media)** · **Working app name: Mentors HQ**

> This is the source-of-truth spec for the build. Where silent, choose the simplest robust option, note the assumption, keep moving.

---

## 1. What we're building & why
A mobile-first operating system for a hybrid venture — a café, a training school, and a media studio — that lets a founder and an operations manager delegate, monitor, score, reward, and pay a small team, while giving every member a premium, transparent experience and a visible path to grow across disciplines.

**Principles**
- **One team, three brands.** Work is tagged by brand; people leverage across all of them.
- **Win-win, not surveillance.** Transparency both ways.
- **Output over hours.** Hybrid roles measured by what ships, per brand.
- **Premium feel.** Part of the employer brand.
- **Built to last & to sell.** Clean data, audit trail, exportable records.
- **Mobile-first PWA.** Installable, fully usable on a phone.

## 2. The organization
**Brands:** `Mentors` (Café/MBC) · `CLMA` (School) · `FNN` (Media) · `Personal` (Founder personal brand).

| Seat | App role | Primary brand | Supports |
|---|---|---|---|
| Founder & Chief Vision Officer | `founder` (super admin) | All + Personal | All |
| Operations & Growth Manager | `ops_manager` (admin) | All three | — |
| Café Brand Ambassador | `cafe_ambassador` | Mentors | CLMA, FNN, Personal |
| Media & Growth Producer | `media_producer` | FNN + Personal | Mentors, CLMA |
| Learning & Community Officer | `learning_officer` | CLMA | Mentors, FNN |

Job-title fixed strings: *Founder & Chief Vision Officer, Operations & Growth Manager, Café Brand Ambassador, Media & Growth Producer, Learning & Community Officer.*

Permissions enforced at DB level via RLS. Founder = super admin; ops_manager = admin (proposes, prepares, scoped announcements); employees = own data + submit reports.

## 3. Tech stack
Next.js (App Router) + TS + Tailwind + shadcn/ui as installable PWA · Supabase (Postgres + Auth + Storage + RLS) · Vercel + Supabase cloud · server-side HTML→PDF payslips · Phase 3 notifications (web push + optional Resend email). No native RN/Expo for MVP.

## 4. Core features (A–P)
- **A. Auth & onboarding** — email/password; founder invites → role, title, base salary, hire date, schedule, founding-team flag; branded welcome.
- **B. Brand-aware home** — today's tasks (brand tags), week KPIs vs target, Expected-pay live total, Scorecard avg + level, pinned announcement, "+ Log work", brand filter chips.
- **C. Task mgmt & delegation** — brand-tagged, priority, due, attachments; status To-do→In progress→Submitted→Done (+Blocked); relay stage Capture→Produce→Publish→Engage→Convert→Report; Kanban+list; blocked floats to top.
- **D. Reporting & media uploads ("Log work")** — upload video/images/docs, brand-tagged; types Daily update / Output / Weekly win / Extra-mile; extra-mile feed with kudos.
- **E. Cadence tools** — Daily Huddle (shipped/shipping/blockers) + Weekly Wins & Learnings (win/learning/ask); founder+ops digest.
- **F. Quality Scorecard** — monthly 1–5 on Output, Craft, Reliability, Ownership, Growth; bands <3.0 / 3.0–3.9 / 4.0+.
- **G. KPI engine** — role templates (admin-editable); attainment % = avg(min(actual/target,1)); ≥80% unlocks profit-share; rolls up per brand.
- **H. Content & virality scoreboard** — assets w/ brand, platform, reach/saves/shares; breakout flag; per-brand pipeline view.
- **I. Incentive engine** — role-specific, quality-gated (craft ≥ 3.5 + good standing); auto-flag → ops proposes → founder approves → flows to Expected-pay + payslip.
- **J. Profit-sharing** — brand financials → company profit; tiers <50k none / 50–99,999 3% / 100–199,999 5% / 200k+ 7%; split Producer 40 / Officer 35 / Ambassador 25; eligibility ≥90 days, no flag, KPI ≥80%; founder approves.
- **K. Expected-pay view** — base(prorated) + approved incentives + projected profit-share − deductions − statutory = projected net, with pay date.
- **L. Attendance, deductions & payroll (PH)** — mobile time-in/out, late rule, statuses; semi-monthly (15th/30th); payslip line items + SSS/PhilHealth/Pag-IBIG editable tables; 13th-month accrual; Draft→Issued + PDF.
- **M. Announcements, notes & Founding-Team wall** — audience all/role/brand/individual; pin; seen-by; founding perks + auto 12-month one-week-salary bonus.
- **N. Brand dashboards & Coverage Matrix** — 5 seats × 4 brands grid; per-brand dashboards; founder analytics.
- **O. Career tracks** — per-role ladders + promotion gates (tenure, sustained scorecard×2, ownership, readiness).
- **P. Admin backend** — visibility controls, config-without-code, people admin, approvals queue, audit log.

### KPI defaults
- **Café Brand Ambassador:** Customer rating 4.8/5 · 75 content assets · 10 membership referrals · 5 workshop referrals · 95% attendance
- **Media & Growth Producer:** 60 published · 40 short-form · 20 podcast clips · 50 qualified leads · 10% audience growth
- **Learning & Community Officer:** 10 enrollments · 15 membership sales · 80% event capacity · 90% satisfaction · 85% completion
- **Operations & Growth Manager:** revenue vs target · team KPI ≥85% · on-time ≥90% · systems shipped

### Incentive defaults (admin-editable; quality gate craft ≥ 3.5)
- **Ambassador:** ₱100/member referral · ₱200/enrollment referral · 75 assets ₱1,000 · 100 assets ₱2,000
- **Producer:** 60 posts ₱1,000 · 80 ₱2,500 · 100 ₱4,000 · 50 leads ₱1,000 · 100 leads ₱3,000 · ₱300/podcast episode
- **Officer:** ₱250/paid student · ₱100/paid member · ₱500/completed batch · ₱1,000/successful event

### Career tracks
- **Ambassador** → Community Lead → Brand Experience Supervisor → Community & Membership Manager → Operations Manager
- **Producer** → Content Strategist → Media Producer → Media Director → FNN Media General Manager
- **Officer** → Program Coordinator → Training Manager → School Operations Manager → CLMA Director
- **Ops Manager** → Head of Operations → General Manager → Chief Operating Officer

## 5. Data model (key entities)
brands · users · user_brand_coverage · tasks (+task_brands) · reports (+report_media, report_brands) · content_assets · kpi_templates (+kpi_targets) · scorecards · bonus_rules (+incentives) · brand_financials → profit_pool → profit_shares · attendance (+deductions) · statutory_config · payslips · career_tracks (+level_progress) · founder_comp_roadmap · announcements (+notes) · visibility_settings · audit_log · cadence_checkins.

## 6. Business logic
Brands tag everything; attainment % = avg(min(actual/target,1)) ≥80% unlocks profit-share; quality gate craft ≥3.5; profit pool tiered 0/3/5/7% split 40/35/25; Expected-pay formula; founding-team auto 12-month bonus; founder comp roadmap P1 ₱15–20k / P2 ₱25–35k / P3 ₱40–60k; PH semi-monthly + 13th-month + editable statutory; everything tunable is admin config.

## 7. Design
Obsidian `#0B0B0D` · Gold `#D4AF37` · Copper `#B87333` · Bone White `#F4F1EA`. Cormorant Garamond (display) + Montserrat (Inter fallback, UI). Dark cinematic, restrained, premium "moments". Mobile-first installable PWA.

## 8. Security & compliance
PH Data Privacy Act (RA 10173): minimal collection, consent at onboarding, role restriction, RLS (employees read only own sensitive data), encrypted media + signed URLs, audit-log all changes to pay/scores/profit-share/visibility. Never expose another employee's salary, scores, or payslips.

## 9. Build plan (phased)
- **Phase 1 — MVP:** auth + 5 roles + RLS · brand model + tagging · brand-aware home · task assign/status · "Log work" uploads · daily huddle + weekly wins · announcements + founding-team flag · branded PWA shell.
- **Phase 2 — Measure & pay:** Scorecard · KPI engine + attainment · content/virality · incentive engine + gates + approvals · Expected-pay · attendance + deductions · semi-monthly payroll + PDF · career view · visibility + audit log.
- **Phase 3 — Multi-brand & profit:** brand financials · profit-sharing · brand dashboards + coverage matrix · founder comp roadmap · founding-team wall + 12-month bonus · promotions · analytics · notifications · CRM/payment export · data export.

## 10. Definition of done — Phase 1
Founder invites a user (role, title, salary, founding-team flag) who logs in on a phone; assigns a brand-tagged task the user updates and submits with a photo/video; the user posts a daily huddle and weekly win; the founder pins an announcement that appears on the home screen; permissions are DB-enforced; the app is installable and on-brand.
