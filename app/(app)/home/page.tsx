import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BrandChip } from "@/components/brand-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_SLUGS, type BrandSlug } from "@/lib/constants";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // The user's brand coverage (drives their brand chips).
  const { data: coverage } = await supabase
    .from("user_brand_coverage")
    .select("level, brands(slug)")
    .eq("user_id", profile.id);

  const myBrands =
    (coverage
      ?.map((c) => (c.brands as unknown as { slug: BrandSlug } | null)?.slug)
      .filter(Boolean) as BrandSlug[]) ?? [];

  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-4xl leading-tight text-bone">{firstName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-copper/50 text-copper">
            {profile.job_title}
          </Badge>
          {profile.founding_team && (
            <Badge className="bg-gold text-obsidian hover:bg-gold">Founding team</Badge>
          )}
        </div>
      </section>

      {/* Brand filter (preview — wired in Stage B) */}
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Brands</p>
        <div className="flex flex-wrap gap-2">
          {(myBrands.length ? myBrands : (BRAND_SLUGS as readonly BrandSlug[])).map((slug) => (
            <BrandChip key={slug} slug={slug} />
          ))}
        </div>
      </section>

      {/* Phase-1 stage-A placeholders for the cadence features (Stage B) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s tasks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Brand-tagged tasks will appear here. Coming next in the build.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pinned announcement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The founder&apos;s pinned note will surface here.
        </CardContent>
      </Card>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Foundation checkpoint · cadence tools (tasks, “Log work”, huddle, announcements) come next.
      </p>
    </div>
  );
}
