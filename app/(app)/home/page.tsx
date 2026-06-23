import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchTasks } from "@/lib/tasks-query";
import { BrandFilter } from "@/components/brand-filter";
import { TaskCard } from "@/components/task-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CirclePlus, Pin, ChevronRight } from "lucide-react";
import { BRAND_SLUGS, type BrandSlug } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "Home" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const profile = await requireProfile();
  const { brand } = await searchParams;
  const activeBrand = (BRAND_SLUGS as readonly string[]).includes(brand ?? "")
    ? (brand as BrandSlug)
    : undefined;

  const supabase = await createClient();

  // Pinned announcements visible to me.
  const { data: pinnedData } = await supabase
    .from("announcements")
    .select("*")
    .eq("pinned", true)
    .order("created_at", { ascending: false })
    .limit(3);
  const pinned = (pinnedData as Announcement[] | null) ?? [];

  // My open tasks (optionally brand-filtered).
  const allMine = (await fetchTasks(activeBrand)).filter(
    (t) => t.assignee_id === profile.id && t.status !== "done",
  );
  const myTasks = allMine.slice(0, 5);

  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
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

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Filter by brand</p>
        <BrandFilter active={activeBrand} />
      </section>

      <Button render={<Link href="/log" />} nativeButton={false} className="w-full gap-2" size="lg">
        <CirclePlus className="h-5 w-5" /> Log work
      </Button>

      {pinned.length > 0 && (
        <section className="space-y-2">
          {pinned.map((a) => (
            <Card key={a.id} className="border-gold/30 bg-gold/5 p-3">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-gold" />
                <h2 className="font-display text-lg leading-tight text-bone">{a.title}</h2>
              </div>
              {a.body && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{a.body}</p>}
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s tasks
          </h2>
          <Link href="/tasks" className="flex items-center text-xs text-copper">
            All tasks <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {activeBrand ? "No open tasks for this brand." : "No open tasks. Nice and clear."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {myTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </section>

      <Link
        href="/announcements"
        className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
      >
        <span>All announcements</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
