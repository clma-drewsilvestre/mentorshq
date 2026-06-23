import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrandsMap } from "@/lib/brands";
import { NewAnnouncementDialog } from "./new-announcement-dialog";
import { DeleteAnnouncementButton } from "./delete-announcement-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin } from "lucide-react";
import { ROLE_LABEL, isManagement } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "Announcements" };

type Row = Announcement & { author: { full_name: string } | null };

export default async function AnnouncementsPage() {
  const me = await requireProfile();
  const manager = isManagement(me.role);
  const supabase = await createClient();
  const brands = await getBrandsMap();

  const { data } = await supabase
    .from("announcements")
    .select("*, author:profiles!announcements_author_id_fkey(full_name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data as Row[] | null) ?? [];

  let team: { id: string; full_name: string; email: string }[] = [];
  if (manager) {
    const { data: t } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    team = t ?? [];
  }

  function audienceLabel(a: Row) {
    if (a.audience === "all") return "Everyone";
    if (a.audience === "role" && a.audience_role) return ROLE_LABEL[a.audience_role];
    if (a.audience === "brand" && a.brand_id) return brands.byId[a.brand_id]?.name ?? "Brand";
    if (a.audience === "individual") return "Direct";
    return "Everyone";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-bone">Announcements</h1>
          <p className="text-sm text-muted-foreground">{items.length} posts</p>
        </div>
        {manager && <NewAnnouncementDialog team={team} />}
      </div>

      {items.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Nothing posted yet.</p>
      )}

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {a.pinned && <Pin className="h-4 w-4 text-gold" />}
                <h2 className="font-display text-xl leading-tight text-bone">{a.title}</h2>
              </div>
              {manager && <DeleteAnnouncementButton id={a.id} />}
            </div>
            {a.body && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                {audienceLabel(a)}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {a.author?.full_name} ·{" "}
                {new Date(a.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
