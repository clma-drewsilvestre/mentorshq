import type {
  Role,
  BrandSlug,
  TaskStatus,
  TaskPriority,
  HandoffStage,
  ReportType,
  MediaKind,
  AudienceKind,
} from "@/lib/constants";

export type UserStatus = "invited" | "active" | "suspended";
export type CoverageLevel = "primary" | "support";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  job_title: string;
  level: number;
  base_salary: number;
  schedule: Record<string, unknown>;
  date_hired: string | null;
  founding_team: boolean;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  slug: BrandSlug;
  name: string;
  kind: string;
  created_at: string;
}

export interface UserBrandCoverage {
  id: string;
  user_id: string;
  brand_id: string;
  level: CoverageLevel;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  assigner_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  handoff_stage: HandoffStage | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** Task joined with brand slugs + assignee name for list/board rendering. */
export interface TaskWithMeta extends Task {
  brands: BrandSlug[];
  assignee_name?: string | null;
}

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  body: string;
  link: string | null;
  task_id: string | null;
  created_at: string;
}

export interface ReportMedia {
  id: string;
  report_id: string;
  file_path: string;
  kind: MediaKind;
  created_at: string;
}

export interface Announcement {
  id: string;
  author_id: string | null;
  title: string;
  body: string;
  audience: AudienceKind;
  audience_role: Role | null;
  brand_id: string | null;
  target_user_id: string | null;
  pinned: boolean;
  created_at: string;
}
