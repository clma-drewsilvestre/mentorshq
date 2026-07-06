"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireManager, requireFounder } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localDateISO } from "@/lib/periods";

type ActionResult = { ok?: boolean; error?: string };

/** Parses a "HH:MM" schedule.start string against today's date, in local time. */
function scheduledStartToday(schedule: Record<string, unknown>): Date | null {
  const start = typeof schedule?.start === "string" ? schedule.start : null;
  if (!start || !/^\d{1,2}:\d{2}$/.test(start)) return null;
  const [h, m] = start.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export async function clockIn(): Promise<ActionResult> {
  const me = await requireProfile();
  const supabase = await createClient();
  const today = localDateISO();
  const now = new Date();

  const scheduledStart = scheduledStartToday(me.schedule);
  const late = scheduledStart ? now.getTime() > scheduledStart.getTime() : false;
  const lateMinutes = scheduledStart && late
    ? Math.round((now.getTime() - scheduledStart.getTime()) / 60000)
    : 0;

  const { error } = await supabase.from("attendance").upsert(
    {
      user_id: me.id,
      date: today,
      time_in: now.toISOString(),
      status: late ? "late" : "on_time",
      late_minutes: lateMinutes,
    },
    { onConflict: "user_id,date" },
  );

  if (error) return { error: error.message };
  revalidatePath("/pay");
  return { ok: true };
}

export async function clockOut(): Promise<ActionResult> {
  const me = await requireProfile();
  const supabase = await createClient();
  const today = localDateISO();

  const { error } = await supabase
    .from("attendance")
    .update({ time_out: new Date().toISOString() })
    .eq("user_id", me.id)
    .eq("date", today);

  if (error) return { error: error.message };
  revalidatePath("/pay");
  return { ok: true };
}

export async function createPayslip(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const manager = await requireManager();
  const supabase = await createClient();

  const user_id = String(formData.get("user_id") ?? "").trim();
  const period_start = String(formData.get("period_start") ?? "").trim();
  const period_end = String(formData.get("period_end") ?? "").trim();
  const basic = Number(formData.get("basic") ?? 0) || 0;
  const deductions_total = Number(formData.get("deductions_total") ?? 0) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!user_id) return { error: "Pick a team member." };
  if (!period_start || !period_end) return { error: "Set the pay period." };
  if (basic < 0 || deductions_total < 0) return { error: "Amounts can't be negative." };

  const net = Math.max(0, basic - deductions_total);

  const { error } = await supabase.from("payslips").insert({
    user_id,
    period_start,
    period_end,
    basic,
    deductions_total,
    net,
    notes,
    created_by: manager.id,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePath("/pay");
  return { ok: true };
}

/** Only the founder issues payroll (spec: ops "prepares", founder "runs/issues"). */
export async function issuePayslip(payslipId: string): Promise<ActionResult> {
  await requireFounder();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payslips")
    .update({ status: "issued", issued_at: new Date().toISOString() })
    .eq("id", payslipId);

  if (error) return { error: error.message };
  revalidatePath("/pay");
  return { ok: true };
}
