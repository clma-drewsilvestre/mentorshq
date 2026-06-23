import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteDialog } from "./invite-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Team" };

function initials(name: string, email: string) {
  const base = name?.trim() || email;
  return base.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default async function PeoplePage() {
  const me = await requireManager();
  const supabase = await createClient();

  // RLS lets managers read all profiles; employees never reach this page.
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const people = (data as Profile[] | null) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-bone">Team</h1>
          <p className="text-sm text-muted-foreground">{people.length} members</p>
        </div>
        {me.role === "founder" && <InviteDialog />}
      </div>

      <ul className="space-y-3">
        {people.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-3">
            <Avatar className="h-10 w-10 border border-copper/40">
              <AvatarFallback className="bg-card text-xs text-bone">
                {initials(p.full_name, p.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{p.full_name || p.email}</span>
                {p.founding_team && (
                  <span className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                    Founding
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{p.job_title}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                {ROLE_LABEL[p.role as Role]}
              </Badge>
              {p.status !== "active" && (
                <span className="text-[10px] capitalize text-copper">{p.status}</span>
              )}
            </div>
          </Card>
        ))}
        {people.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No team members yet. Invite your first hire.
          </p>
        )}
      </ul>
    </div>
  );
}
