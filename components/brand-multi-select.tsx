"use client";

import { useState } from "react";
import { BRAND_SLUGS, BRANDS, type BrandSlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Toggleable brand tags for forms. Emits hidden <input name> per selected slug
 * so server actions can read them via formData.getAll(name).
 */
export function BrandMultiSelect({
  name = "brands",
  defaultValue = [],
}: {
  name?: string;
  defaultValue?: BrandSlug[];
}) {
  const [selected, setSelected] = useState<BrandSlug[]>(defaultValue);

  function toggle(slug: BrandSlug) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BRAND_SLUGS.map((slug) => {
        const active = selected.includes(slug);
        const brand = BRANDS[slug];
        return (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-gold/60 bg-gold/10 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(${brand.colorVar})` }} />
            {brand.short}
          </button>
        );
      })}
      {selected.map((s) => (
        <input key={s} type="hidden" name={name} value={s} />
      ))}
    </div>
  );
}
