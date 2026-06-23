import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import { LogWorkForm } from "./log-work-form";
import { KudosButton } from "./kudos-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandChip } from "@/components/brand-chip";
import { Badge } from "@/components/ui/badge";
import { REPORT_TYPE_LABEL, isManagement, type BrandSlug, type ReportType, type MediaKind } from "@/lib/constants";

export const metadata = { title: "Log work" };

type MediaRow = { id: string; file_path: string; kind: MediaKind };
type ReportRow = {
  id: string;
  type: ReportType;
  body: string;
  created_at: string;
  user_id: string;
  report_media: MediaRow[] | null;
  report_brands: { brand_id: string }[] | null;
  report_kudos: { user_id: string }[] | null;
  author: { full_name: string } | null;
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function LogPage() {
  const me = await requireProfile();
  const manager = isManagement(me.role);
  const supabase = await createClient();
  const brands = await getBrandsMap();

  // My open tasks for the optional link.
  const { data: myTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("assignee_id", me.id)
    .neq("status", "done")
    .order("created_at", { ascending: false });

  // Feed (RLS-scoped: own for employees, all for managers).
  const { data } = await supabase
    .from("reports")
    .select(
      "id, type, body, created_at, user_id, report_media(id, file_path, kind), report_brands(brand_id), report_kudos(user_id), author:profiles!reports_user_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  const reports = (data as ReportRow[] | null) ?? [];

  // Sign all media paths in one batch.
  const allPaths = reports.flatMap((r) => (r.report_media ?? []).map((m) => m.file_path));
  const urlByPath = new Map<string, string>();
  if (allPaths.length) {
    const { data: signed } = await supabase.storage
      .from("work-media")
      .createSignedUrls(allPaths, 3600);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-bone">Log work</h1>
        <p className="text-sm text-muted-foreground">Capture output, wins, and extra-mile effort.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New log</CardTitle>
        </CardHeader>
        <CardContent>
          <LogWorkForm tasks={myTasks ?? []} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {manager ? "Team activity" : "My activity"}
        </h2>
        {reports.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
        {reports.map((r) => {
          const slugs = (r.report_brands ?? [])
            .map((rb) => brands.slugById(rb.brand_id))
            .filter((s): s is BrandSlug => Boolean(s));
          const kudos = r.report_kudos ?? [];
          const mine = kudos.some((k) => k.user_id === me.id);
          return (
            <Card key={r.id} className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-copper/50 text-[10px] text-copper">
                    {REPORT_TYPE_LABEL[r.type]}
                  </Badge>
                  {manager && (
                    <span className="text-xs text-muted-foreground">{r.author?.full_name}</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>

              {r.body && <p className="whitespace-pre-wrap text-sm">{r.body}</p>}

              {(r.report_media ?? []).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {(r.report_media ?? []).map((m) => {
                    const url = urlByPath.get(m.file_path);
                    if (!url) return null;
                    if (m.kind === "image")
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img key={m.id} src={url} alt="" className="h-28 w-full rounded-md object-cover" />;
                    if (m.kind === "video")
                      return <video key={m.id} src={url} controls className="h-28 w-full rounded-md object-cover" />;
                    return (
                      <a key={m.id} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex h-28 items-center justify-center rounded-md border border-border text-xs text-copper">
                        Open document
                      </a>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {slugs.map((s) => (
                    <BrandChip key={s} slug={s} />
                  ))}
                </div>
                <KudosButton
                  reportId={r.id}
                  count={kudos.length}
                  mine={mine}
                  canKudos={manager && r.user_id !== me.id}
                />
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
