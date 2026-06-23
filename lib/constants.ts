// Shared domain constants for Mentors HQ. Keep in sync with supabase/migrations.

export const ROLES = [
  "founder",
  "ops_manager",
  "cafe_ambassador",
  "media_producer",
  "learning_officer",
] as const;
export type Role = (typeof ROLES)[number];

export const MANAGEMENT_ROLES: Role[] = ["founder", "ops_manager"];

export function isManagement(role: Role): boolean {
  return MANAGEMENT_ROLES.includes(role);
}

// Fixed job-title strings (spec §2 — use exactly).
export const ROLE_JOB_TITLE: Record<Role, string> = {
  founder: "Founder & Chief Vision Officer",
  ops_manager: "Operations & Growth Manager",
  cafe_ambassador: "Café Brand Ambassador",
  media_producer: "Media & Growth Producer",
  learning_officer: "Learning & Community Officer",
};

// Short labels for chips/menus.
export const ROLE_LABEL: Record<Role, string> = {
  founder: "Founder",
  ops_manager: "Ops Manager",
  cafe_ambassador: "Café Ambassador",
  media_producer: "Media Producer",
  learning_officer: "Learning Officer",
};

// Roles a founder can assign when inviting (everyone except a second founder by default).
export const ASSIGNABLE_ROLES: Role[] = [
  "ops_manager",
  "cafe_ambassador",
  "media_producer",
  "learning_officer",
];

// --- Tasks -----------------------------------------------------------------
export const TASK_STATUSES = ["todo", "in_progress", "submitted", "done", "blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To-do",
  in_progress: "In progress",
  submitted: "Submitted",
  done: "Done",
  blocked: "Blocked",
};

// Board column order — Blocked floats to the top for the huddle (spec §C).
export const BOARD_COLUMNS: TaskStatus[] = ["blocked", "todo", "in_progress", "submitted", "done"];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const HANDOFF_STAGES = ["capture", "produce", "publish", "engage", "convert", "report"] as const;
export type HandoffStage = (typeof HANDOFF_STAGES)[number];
export const HANDOFF_LABEL: Record<HandoffStage, string> = {
  capture: "Capture",
  produce: "Produce",
  publish: "Publish",
  engage: "Engage",
  convert: "Convert",
  report: "Report",
};

// --- Reports ("Log work") --------------------------------------------------
export const REPORT_TYPES = ["daily_update", "output", "weekly_win", "extra_mile"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily_update: "Daily update",
  output: "Output / deliverable",
  weekly_win: "Weekly win",
  extra_mile: "Extra-mile",
};

export type MediaKind = "image" | "video" | "document";

// --- Announcements ---------------------------------------------------------
export type AudienceKind = "all" | "role" | "brand" | "individual";

export const BRAND_SLUGS = ["mentors", "clma", "fnn", "personal"] as const;
export type BrandSlug = (typeof BRAND_SLUGS)[number];

// Default brand coverage per role (drives the live Coverage Matrix, spec §2/§N).
export const ROLE_COVERAGE: Record<
  Role,
  { primary: BrandSlug[]; support: BrandSlug[] }
> = {
  founder: { primary: ["mentors", "clma", "fnn", "personal"], support: [] },
  ops_manager: { primary: ["mentors", "clma", "fnn"], support: [] },
  cafe_ambassador: { primary: ["mentors"], support: ["clma", "fnn", "personal"] },
  media_producer: { primary: ["fnn", "personal"], support: ["mentors", "clma"] },
  learning_officer: { primary: ["clma"], support: ["mentors", "fnn"] },
};

export const BRANDS: Record<
  BrandSlug,
  { name: string; short: string; kind: string; colorVar: string }
> = {
  mentors: { name: "Mentors Business Café", short: "Mentors", kind: "cafe", colorVar: "--brand-mentors" },
  clma: { name: "CLMA", short: "CLMA", kind: "school", colorVar: "--brand-clma" },
  fnn: { name: "FNN", short: "FNN", kind: "media", colorVar: "--brand-fnn" },
  personal: { name: "Personal", short: "Personal", kind: "personal", colorVar: "--brand-personal" },
};
