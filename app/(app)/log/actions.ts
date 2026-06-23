"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import {
  REPORT_TYPES,
  BRAND_SLUGS,
  type ReportType,
  type MediaKind,
  type BrandSlug,
} from "@/lib/constants";

export type ReportInput = {
  type: ReportType;
  body: string;
  brandSlugs: BrandSlug[];
  taskId: string | null;
  media: { file_path: string; kind: MediaKind }[];
};

export async function createReport(
  input: ReportInput,
): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireProfile();
  const supabase = await createClient();

  const type = (REPORT_TYPES as readonly string[]).includes(input.type)
    ? input.type
    : "daily_update";
  const body = (input.body ?? "").trim();
  const media = (input.media ?? []).slice(0, 10);

  if (!body && media.length === 0) {
    return { error: "Add a note or attach at least one file." };
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      user_id: me.id,
      type,
      body,
      task_id: input.taskId,
    })
    .select("id")
    .single();

  if (error || !report) return { error: error?.message ?? "Could not save your log." };

  if (media.length) {
    const { error: mErr } = await supabase.from("report_media").insert(
      media.map((m) => ({ report_id: report.id, file_path: m.file_path, kind: m.kind })),
    );
    if (mErr) return { error: mErr.message };
  }

  const slugs = (input.brandSlugs ?? []).filter((s) =>
    (BRAND_SLUGS as readonly string[]).includes(s),
  );
  if (slugs.length) {
    const brands = await getBrandsMap();
    const rows = slugs
      .map((s) => ({ report_id: report.id, brand_id: brands.idBySlug(s) }))
      .filter((r) => r.brand_id);
    if (rows.length) await supabase.from("report_brands").insert(rows);
  }

  revalidatePath("/log");
  revalidatePath("/home");
  return { ok: true };
}

/** Managers give/remove kudos on a report (spec §D extra-mile feed). */
export async function toggleKudos(reportId: string) {
  const me = await requireManager();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("report_kudos")
    .select("report_id")
    .eq("report_id", reportId)
    .eq("user_id", me.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("report_kudos").delete().eq("report_id", reportId).eq("user_id", me.id);
  } else {
    await supabase.from("report_kudos").insert({ report_id: reportId, user_id: me.id });
  }
  revalidatePath("/log");
  return { ok: true };
}
