"use server";

import { revalidatePath } from "next/cache";
import { requireFounder } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ASSIGNABLE_ROLES,
  ROLE_JOB_TITLE,
  ROLE_COVERAGE,
  type Role,
} from "@/lib/constants";

export type InviteState = { ok?: boolean; error?: string };

export async function inviteUser(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  // Re-verify founder server-side (never trust the client/proxy alone).
  const founder = await requireFounder();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const base_salary = Number(formData.get("base_salary") ?? 0) || 0;
  const date_hired = String(formData.get("date_hired") ?? "").trim() || null;

  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  if (!ASSIGNABLE_ROLES.includes(role)) return { error: "Pick a valid role." };
  if (base_salary < 0) return { error: "Salary can't be negative." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // 1) Create the auth user + send the branded invite email.
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${siteUrl}/auth/callback`, data: { full_name } },
  );
  if (inviteErr || !invited?.user) {
    return { error: inviteErr?.message ?? "Could not send the invite." };
  }
  const userId = invited.user.id;

  // 2) Founding-team auto-flag: hired on/before launch date.
  const launch = process.env.APP_LAUNCH_DATE;
  const founding = Boolean(date_hired && launch && date_hired <= launch);

  // 3) Profile row.
  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    full_name,
    email,
    role,
    job_title: ROLE_JOB_TITLE[role],
    base_salary,
    date_hired,
    founding_team: founding,
    status: "invited",
  });
  if (profileErr) {
    // Roll back the orphaned auth user so the email can be retried cleanly.
    await admin.auth.admin.deleteUser(userId);
    return { error: profileErr.message };
  }

  // 4) Seed brand coverage for the Coverage Matrix.
  const { data: brands } = await admin.from("brands").select("id, slug");
  const idBySlug = Object.fromEntries((brands ?? []).map((b) => [b.slug, b.id]));
  const cov = ROLE_COVERAGE[role];
  const rows = [
    ...cov.primary.map((s) => ({ user_id: userId, brand_id: idBySlug[s], level: "primary" as const })),
    ...cov.support.map((s) => ({ user_id: userId, brand_id: idBySlug[s], level: "support" as const })),
  ].filter((r) => r.brand_id);
  if (rows.length) await admin.from("user_brand_coverage").insert(rows);

  // 5) Audit trail.
  await admin.from("audit_log").insert({
    actor_id: founder.id,
    action: "invite.create",
    entity: "profiles",
    entity_id: userId,
    after: { email, role, founding_team: founding },
  });

  revalidatePath("/admin/people");
  return { ok: true };
}
