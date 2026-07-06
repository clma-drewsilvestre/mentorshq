"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clockIn, clockOut } from "./actions";

export function ClockButtons({
  hasTimeIn,
  hasTimeOut,
}: {
  hasTimeIn: boolean;
  hasTimeOut: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: () => Promise<{ ok?: boolean; error?: string }>) {
    start(async () => {
      const res = await action();
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  if (hasTimeOut) {
    return <p className="text-sm text-muted-foreground">You&apos;re clocked out for today.</p>;
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        disabled={pending || hasTimeIn}
        onClick={() => run(clockIn)}
      >
        {hasTimeIn ? "Clocked in" : "Clock in"}
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        disabled={pending || !hasTimeIn}
        onClick={() => run(clockOut)}
      >
        Clock out
      </Button>
    </div>
  );
}
