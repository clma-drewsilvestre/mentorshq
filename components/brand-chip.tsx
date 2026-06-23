import { cn } from "@/lib/utils";
import { BRANDS, type BrandSlug } from "@/lib/constants";

/**
 * Presentational brand chip — colored dot + label. Reused by tasks, reports,
 * announcements, and the home brand filter (Stage B wires interactivity).
 */
export function BrandChip({
  slug,
  active = true,
  className,
}: {
  slug: BrandSlug;
  active?: boolean;
  className?: string;
}) {
  const brand = BRANDS[slug];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-border bg-card text-foreground"
          : "border-border/50 bg-transparent text-muted-foreground",
        className,
      )}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: `var(${brand.colorVar})` }}
      />
      {brand.short}
    </span>
  );
}
