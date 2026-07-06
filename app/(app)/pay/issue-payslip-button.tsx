"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { issuePayslip } from "./actions";

export function IssuePayslipButton({ payslipId }: { payslipId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await issuePayslip(payslipId);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Payslip issued");
            router.refresh();
          }
        })
      }
    >
      {pending ? "Issuing…" : "Mark issued"}
    </Button>
  );
}
