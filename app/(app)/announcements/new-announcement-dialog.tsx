"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { createAnnouncement, type AnnouncementState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ASSIGNABLE_ROLES,
  ROLE_JOB_TITLE,
  BRAND_SLUGS,
  BRANDS,
  type AudienceKind,
} from "@/lib/constants";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Posting…" : "Post"}
    </Button>
  );
}

export function NewAnnouncementDialog({
  team,
}: {
  team: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<AudienceKind>("all");
  const [state, formAction] = useActionState<AnnouncementState, FormData>(createAnnouncement, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Announcement posted");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Megaphone className="h-4 w-4" />
        Post
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">New announcement</DialogTitle>
          <DialogDescription>Share news with the team or a specific audience.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="This week at MILE" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={3} placeholder="What's the news?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Audience</Label>
            <select
              id="audience"
              name="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as AudienceKind)}
              className={selectClass}
            >
              <option value="all">Everyone</option>
              <option value="role">A role</option>
              <option value="brand">A brand</option>
              <option value="individual">One person</option>
            </select>
          </div>

          {audience === "role" && (
            <div className="space-y-2">
              <Label htmlFor="audience_role">Role</Label>
              <select id="audience_role" name="audience_role" defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Select…
                </option>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_JOB_TITLE[r]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {audience === "brand" && (
            <div className="space-y-2">
              <Label htmlFor="brand_slug">Brand</Label>
              <select id="brand_slug" name="brand_slug" defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Select…
                </option>
                {BRAND_SLUGS.map((s) => (
                  <option key={s} value={s}>
                    {BRANDS[s].name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {audience === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="target_user_id">Person</Label>
              <select id="target_user_id" name="target_user_id" defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Select…
                </option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pinned" className="h-4 w-4 accent-[var(--gold)]" />
            Pin to the top of Home
          </label>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
