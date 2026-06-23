import { Card } from "@/components/ui/card";
import { BrandChip } from "@/components/brand-chip";
import { TaskStatusSelect } from "@/app/(app)/tasks/task-status-select";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, HANDOFF_LABEL, type TaskPriority } from "@/lib/constants";
import type { TaskWithMeta } from "@/lib/types";

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-copper",
  urgent: "text-destructive",
};

function formatDue(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function TaskCard({
  task,
  showAssignee = false,
  showStatus = true,
}: {
  task: TaskWithMeta;
  showAssignee?: boolean;
  showStatus?: boolean;
}) {
  const overdue =
    task.due_date && task.status !== "done" && new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{task.title}</p>
        <span className={cn("shrink-0 text-[10px] font-semibold uppercase", PRIORITY_CLASS[task.priority])}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {task.brands.map((slug) => (
          <BrandChip key={slug} slug={slug} />
        ))}
        {task.handoff_stage && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {HANDOFF_LABEL[task.handoff_stage]}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.due_date && (
            <span className={cn(overdue && "font-medium text-destructive")}>
              Due {formatDue(task.due_date)}
            </span>
          )}
          {showAssignee && (
            <span className="truncate">{task.assignee_name || "Unassigned"}</span>
          )}
        </div>
        {showStatus && <TaskStatusSelect taskId={task.id} status={task.status} />}
      </div>
    </Card>
  );
}
