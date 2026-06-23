"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "./actions";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete announcement"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteAnnouncement(id);
          if (res?.error) toast.error(res.error);
          else router.refresh();
        })
      }
      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
