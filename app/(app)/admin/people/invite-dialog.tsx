"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { inviteUser, type InviteState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ASSIGNABLE_ROLES, ROLE_JOB_TITLE } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending invite…" : "Send invite"}
    </Button>
  );
}

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<InviteState, FormData>(inviteUser, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Invite sent", {
        description: "They'll get an email to set a password.",
      });
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <UserPlus className="h-4 w-4" />
        Invite
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">Invite a team member</DialogTitle>
          <DialogDescription>
            Their job title is set automatically by role. They&apos;ll receive an email to finish setup.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required placeholder="Juan dela Cruz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="juan@mile.inc" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              required
              defaultValue=""
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a role…
              </option>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_JOB_TITLE[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Base salary (₱)</Label>
              <Input id="base_salary" name="base_salary" type="number" min={0} step={100} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_hired">Date hired</Label>
              <Input id="date_hired" name="date_hired" type="date" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Hired on/before the launch date auto-flags as founding team.
          </p>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
