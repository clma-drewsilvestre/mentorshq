"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleKudos } from "./actions";
import { cn } from "@/lib/utils";

export function KudosButton({
  reportId,
  count,
  mine,
  canKudos,
}: {
  reportId: string;
  count: number;
  mine: boolean;
  canKudos: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!canKudos) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Heart className={cn("h-3.5 w-3.5", count > 0 && "fill-gold text-gold")} />
        {count}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleKudos(reportId);
          router.refresh();
        })
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-50",
        mine ? "border-gold/60 text-gold" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", mine && "fill-gold text-gold")} />
      {count}
    </button>
  );
}
