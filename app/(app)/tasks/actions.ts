"use server";

import { revalidatePath } from "next/cache";
import { requireManager, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  HANDOFF_STAGES,
  BRAND_SLUGS,
  type TaskStatus,
  type TaskPriority,
  type HandoffStage,
  type BrandSlug,
} from "@/lib/constants";

export type TaskFormState = { ok?: boolean; error?: string };

export async function createTask(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const manager = await requireManager();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const assignee_id = String(formData.get("assignee_id") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "medium") as TaskPriority;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const handoffRaw = String(formData.get("handoff_stage") ?? "").trim();
  const handoff_stage = (HANDOFF_STAGES as readonly string[]).includes(handoffRaw)
    ? (handoffRaw as HandoffStage)
    : null;
  const brandSlugs = (formData.getAll("brands") as string[]).filter((s) =>
    (BRAND_SLUGS as readonly string[]).includes(s),
  ) as BrandSlug[];

  if (!title) return { error: "Give the task a title." };
  if (!(TASK_PRIORITIES as readonly string[]).includes(priority))
    return { error: "Invalid priority." };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      assignee_id,
      assigner_id: manager.id,
      priority,
      due_date,
      handoff_stage,
      status: "todo",
    })
    .select("id")
    .single();

  if (error || !task) return { error: error?.message ?? "Could not create task." };

  if (brandSlugs.length) {
    const brands = await getBrandsMap();
    const rows = brandSlugs
      .map((s) => ({ task_id: task.id, brand_id: brands.idBySlug(s) }))
      .filter((r) => r.brand_id);
    if (rows.length) await supabase.from("task_brands").insert(rows);
  }

  revalidatePath("/tasks");
  revalidatePath("/home");
  return { ok: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await requireProfile();
  if (!(TASK_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/home");
  return { ok: true };
}
