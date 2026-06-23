"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BRAND_SLUGS, BRANDS, type BrandSlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Brand filter chips that scope a view via the `?brand=` search param. */
export function BrandFilter({ active }: { active?: BrandSlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function select(slug?: BrandSlug) {
    const p = new URLSearchParams(sp.toString());
    if (slug) p.set("brand", slug);
    else p.delete("brand");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="All" active={!active} onClick={() => select(undefined)} />
      {BRAND_SLUGS.map((slug) => (
        <Chip
          key={slug}
          label={BRANDS[slug].short}
          color={`var(${BRANDS[slug].colorVar})`}
          active={active === slug}
          onClick={() => select(slug)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-gold/60 bg-gold/10 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
