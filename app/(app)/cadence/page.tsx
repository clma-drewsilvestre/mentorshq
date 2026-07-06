import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HuddleForm, WeeklyForm } from "./checkin-forms";
import { localDateISO, weekStartISO } from "@/lib/periods";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isViewer, isBoard } from "@/lib/constants";

export const metadata = { title: "Cadence" };

type CheckinRow = {
  user_id: string;
  content: Record<string, string>;
  author: { full_name: string } | null;
};

export default async function CadencePage() {
  const me = await requireProfile();
  const canViewTeam = isViewer(me.role); // managers + board see the team digest
  const isOperator = !isBoard(me.role); // board doesn't ship daily work
  const supabase = await createClient();
  const today = localDateISO();
  const weekStart = weekStartISO();

  const [myHuddleRes, myWeeklyRes, teamHuddlesRes, teamWeekliesRes] = await Promise.all([
    isOperator
      ? supabase
          .from("cadence_checkins")
          .select("content")
          .eq("user_id", me.id)
          .eq("type", "huddle")
          .eq("period", today)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isOperator
      ? supabase
          .from("cadence_checkins")
          .select("content")
          .eq("user_id", me.id)
          .eq("type", "weekly")
          .eq("period", weekStart)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    canViewTeam
      ? supabase
          .from("cadence_checkins")
          .select("user_id, content, author:profiles!cadence_checkins_user_id_fkey(full_name)")
          .eq("type", "huddle")
          .eq("period", today)
      : Promise.resolve({ data: [] }),
    canViewTeam
      ? supabase
          .from("cadence_checkins")
          .select("user_id, content, author:profiles!cadence_checkins_user_id_fkey(full_name)")
          .eq("type", "weekly")
          .eq("period", weekStart)
      : Promise.resolve({ data: [] }),
  ]);
  const myHuddle = myHuddleRes.data;
  const myWeekly = myWeeklyRes.data;
  const teamHuddles = (teamHuddlesRes.data as CheckinRow[] | null) ?? [];
  const teamWeeklies = (teamWeekliesRes.data as CheckinRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-bone">Cadence</h1>
        <p className="text-sm text-muted-foreground">Our daily and weekly rhythm.</p>
      </div>

      {isOperator && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daily huddle</CardTitle>
            </CardHeader>
            <CardContent>
              <HuddleForm defaults={(myHuddle?.content as Record<string, string>) ?? {}} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly wins &amp; learnings</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyForm defaults={(myWeekly?.content as Record<string, string>) ?? {}} />
            </CardContent>
          </Card>
        </>
      )}

      {canViewTeam && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Team digest — today
          </h2>
          {teamHuddles.length === 0 && (
            <p className="text-sm text-muted-foreground">No huddle check-ins yet today.</p>
          )}
          {teamHuddles.map((c) => (
            <Card key={c.user_id} className="space-y-1 p-3 text-sm">
              <p className="font-medium">{c.author?.full_name}</p>
              {c.content.shipped && <p><span className="text-muted-foreground">Shipped:</span> {c.content.shipped}</p>}
              {c.content.shipping && <p><span className="text-muted-foreground">Shipping:</span> {c.content.shipping}</p>}
              {c.content.blockers && <p className="text-destructive"><span className="text-muted-foreground">Blockers:</span> {c.content.blockers}</p>}
            </Card>
          ))}

          {teamWeeklies.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Weekly wins
              </h2>
              {teamWeeklies.map((c) => (
                <Card key={c.user_id} className="space-y-1 p-3 text-sm">
                  <p className="font-medium">{c.author?.full_name}</p>
                  {c.content.win && <p><span className="text-muted-foreground">Win:</span> {c.content.win}</p>}
                  {c.content.learning && <p><span className="text-muted-foreground">Learning:</span> {c.content.learning}</p>}
                  {c.content.ask && <p><span className="text-muted-foreground">Ask:</span> {c.content.ask}</p>}
                </Card>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
