import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import type { Task, TaskWithMeta } from "@/lib/types";
import type { BrandSlug } from "@/lib/constants";

type TaskRow = Task & {
  task_brands: { brand_id: string }[] | null;
  assignee: { full_name: string } | null;
};

/** Fetch all tasks visible to the caller (RLS-scoped), shaped for rendering. */
export async function fetchTasks(filterBrand?: BrandSlug): Promise<TaskWithMeta[]> {
  const supabase = await createClient();
  const brands = await getBrandsMap();

  const { data } = await supabase
    .from("tasks")
    .select("*, task_brands(brand_id), assignee:profiles!tasks_assignee_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  let rows = ((data as TaskRow[] | null) ?? []).map<TaskWithMeta>((t) => ({
    ...t,
    brands: (t.task_brands ?? [])
      .map((tb) => brands.slugById(tb.brand_id))
      .filter((s): s is BrandSlug => Boolean(s)),
    assignee_name: t.assignee?.full_name ?? null,
  }));

  if (filterBrand) rows = rows.filter((t) => t.brands.includes(filterBrand));
  return rows;
}
