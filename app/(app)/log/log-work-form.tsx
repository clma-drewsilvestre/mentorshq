"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createReport } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandMultiSelect } from "@/components/brand-multi-select";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABEL,
  type BrandSlug,
  type MediaKind,
} from "@/lib/constants";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function kindOf(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-60);
}

export function LogWorkForm({ tasks }: { tasks: { id: string; title: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const type = String(fd.get("type") || "daily_update") as (typeof REPORT_TYPES)[number];
    const body = String(fd.get("body") || "");
    const taskId = String(fd.get("task_id") || "") || null;
    const brandSlugs = fd.getAll("brands") as BrandSlug[];
    const files = (fd.getAll("files") as File[]).filter((f) => f && f.size > 0);

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You're signed out — please log in again.");

      const media: { file_path: string; kind: MediaKind }[] = [];
      for (const file of files) {
        const path = `${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error } = await supabase.storage
          .from("work-media")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (error) throw new Error(`Upload failed: ${error.message}`);
        media.push({ file_path: path, kind: kindOf(file.type) });
      }

      const res = await createReport({ type, body, brandSlugs, taskId, media });
      if (res.error) throw new Error(res.error);

      toast.success("Work logged");
      form.reset();
      setFormKey((k) => k + 1); // remount brand selector to clear its state
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select id="type" name="type" defaultValue="daily_update" className={selectClass}>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {REPORT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">What did you ship?</Label>
        <Textarea id="body" name="body" rows={3} placeholder="Short update, output, or win…" />
      </div>

      <div className="space-y-2">
        <Label>Brands</Label>
        <BrandMultiSelect key={formKey} />
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="task_id">Link a task (optional)</Label>
          <select id="task_id" name="task_id" defaultValue="" className={selectClass}>
            <option value="">None</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="files" className="flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" /> Photos, video or docs
        </Label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Logging…" : "Log work"}
      </Button>
    </form>
  );
}
