"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createTask, type TaskFormState } from "./actions";
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
import { BrandMultiSelect } from "@/components/brand-multi-select";
import { TASK_PRIORITIES, PRIORITY_LABEL, HANDOFF_STAGES, HANDOFF_LABEL } from "@/lib/constants";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create task"}
    </Button>
  );
}

export function NewTaskDialog({
  team,
}: {
  team: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(createTask, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Task created");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        New task
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">New task</DialogTitle>
          <DialogDescription>Assign brand-tagged work to a team member.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Shoot 3 reels at the café" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Details</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Optional notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee_id">Assign to</Label>
            <select id="assignee_id" name="assignee_id" defaultValue="" className={selectClass}>
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue="medium" className={selectClass}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="handoff_stage">Relay stage</Label>
            <select id="handoff_stage" name="handoff_stage" defaultValue="" className={selectClass}>
              <option value="">None</option>
              {HANDOFF_STAGES.map((s) => (
                <option key={s} value={s}>
                  {HANDOFF_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Brands</Label>
            <BrandMultiSelect />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
