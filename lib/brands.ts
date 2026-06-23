import { createClient } from "@/lib/supabase/server";
import type { BrandSlug } from "@/lib/constants";
import type { Brand } from "@/lib/types";

export interface BrandsMap {
  list: Brand[];
  bySlug: Record<string, Brand>;
  byId: Record<string, Brand>;
  slugById(id: string): BrandSlug | undefined;
  idBySlug(slug: BrandSlug): string | undefined;
}

/** Fetch all brands once and return lookup helpers. */
export async function getBrandsMap(): Promise<BrandsMap> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("created_at");
  const list = (data as Brand[] | null) ?? [];
  const bySlug = Object.fromEntries(list.map((b) => [b.slug, b]));
  const byId = Object.fromEntries(list.map((b) => [b.id, b]));
  return {
    list,
    bySlug,
    byId,
    slugById: (id) => (byId[id]?.slug as BrandSlug | undefined),
    idBySlug: (slug) => bySlug[slug]?.id,
  };
}
