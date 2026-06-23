"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import {
  ROLES,
  BRAND_SLUGS,
  type Role,
  type AudienceKind,
  type BrandSlug,
} from "@/lib/constants";

export type AnnouncementState = { ok?: boolean; error?: string };

export async function createAnnouncement(
  _prev: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const manager = await requireManager();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all") as AudienceKind;
  const pinned = formData.get("pinned") === "on";

  if (!title) return { error: "Add a title." };

  const row: Record<string, unknown> = {
    author_id: manager.id,
    title,
    body,
    audience,
    pinned,
    audience_role: null,
    brand_id: null,
    target_user_id: null,
  };

  if (audience === "role") {
    const r = String(formData.get("audience_role") ?? "") as Role;
    if (!(ROLES as readonly string[]).includes(r)) return { error: "Pick a role." };
    row.audience_role = r;
  } else if (audience === "brand") {
    const slug = String(formData.get("brand_slug") ?? "") as BrandSlug;
    if (!(BRAND_SLUGS as readonly string[]).includes(slug)) return { error: "Pick a brand." };
    const brands = await getBrandsMap();
    row.brand_id = brands.idBySlug(slug);
  } else if (audience === "individual") {
    const uid = String(formData.get("target_user_id") ?? "").trim();
    if (!uid) return { error: "Pick a person." };
    row.target_user_id = uid;
  }

  const { error } = await supabase.from("announcements").insert(row);
  if (error) return { error: error.message };

  revalidatePath("/announcements");
  revalidatePath("/home");
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/announcements");
  revalidatePath("/home");
  return { ok: true };
}
