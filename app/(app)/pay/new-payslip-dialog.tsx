"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPayslip } from "./actions";
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
import { currentSemiMonthlyPeriod } from "@/lib/periods";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type TeamMember = { id: string; full_name: string; email: string; base_salary: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save draft"}
    </Button>
  );
}

export function NewPayslipDialog({ team }: { team: TeamMember[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [state, formAction] = useActionState(createPayslip, {});
  const period = currentSemiMonthlyPeriod();
  const selected = team.find((m) => m.id === userId);

  useEffect(() => {
    if (state.ok) {
      toast.success("Payslip draft saved");
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
        New payslip
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">New payslip</DialogTitle>
          <DialogDescription>Basic pay minus deductions. Statutory tables come in a later phase.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Team member</Label>
            <select
              id="user_id"
              name="user_id"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={selectClass}
            >
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="period_start">Period start</Label>
              <Input id="period_start" name="period_start" type="date" defaultValue={period.start} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Period end</Label>
              <Input id="period_end" name="period_end" type="date" defaultValue={period.end} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="basic">Basic (₱)</Label>
              <Input
                id="basic"
                name="basic"
                type="number"
                min={0}
                step={0.01}
                defaultValue={selected ? selected.base_salary / 2 : 0}
                key={selected?.id ?? "none"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductions_total">Deductions (₱)</Label>
              <Input id="deductions_total" name="deductions_total" type="number" min={0} step={0.01} defaultValue={0} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Optional" />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
