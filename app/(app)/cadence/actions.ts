"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localDateISO, weekStartISO } from "@/lib/periods";

type CadenceType = "huddle" | "weekly";

export async function submitCheckin(
  type: CadenceType,
  content: Record<string, string>,
): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireProfile();
  const supabase = await createClient();

  const period = type === "huddle" ? localDateISO() : weekStartISO();

  const { error } = await supabase.from("cadence_checkins").upsert(
    { user_id: me.id, type, period, content },
    { onConflict: "user_id,type,period" },
  );

  if (error) return { error: error.message };
  revalidatePath("/cadence");
  revalidatePath("/home");
  return { ok: true };
}
