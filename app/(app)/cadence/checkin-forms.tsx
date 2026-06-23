"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitCheckin } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Field = { name: string; label: string; placeholder?: string };

const HUDDLE_FIELDS: Field[] = [
  { name: "shipped", label: "Shipped yesterday", placeholder: "What got done" },
  { name: "shipping", label: "Shipping today", placeholder: "Today's focus" },
  { name: "blockers", label: "Blockers", placeholder: "Anything in the way?" },
];

const WEEKLY_FIELDS: Field[] = [
  { name: "win", label: "One win", placeholder: "A result you're proud of" },
  { name: "learning", label: "One learning", placeholder: "Something you learned" },
  { name: "ask", label: "One ask", placeholder: "What you need" },
];

function CheckinForm({
  type,
  fields,
  defaults,
  cta,
}: {
  type: "huddle" | "weekly";
  fields: Field[];
  defaults: Record<string, string>;
  cta: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const content: Record<string, string> = {};
    fields.forEach((f) => (content[f.name] = String(fd.get(f.name) || "").trim()));
    setBusy(true);
    const res = await submitCheckin(type, content);
    setBusy(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={`${type}-${f.name}`}>{f.label}</Label>
          <Textarea
            id={`${type}-${f.name}`}
            name={f.name}
            rows={2}
            defaultValue={defaults[f.name] ?? ""}
            placeholder={f.placeholder}
          />
        </div>
      ))}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Saving…" : cta}
      </Button>
    </form>
  );
}

export function HuddleForm({ defaults }: { defaults: Record<string, string> }) {
  return <CheckinForm type="huddle" fields={HUDDLE_FIELDS} defaults={defaults} cta="Save huddle" />;
}

export function WeeklyForm({ defaults }: { defaults: Record<string, string> }) {
  return <CheckinForm type="weekly" fields={WEEKLY_FIELDS} defaults={defaults} cta="Save weekly" />;
}
