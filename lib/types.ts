import type { Role, BrandSlug } from "@/lib/constants";

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
