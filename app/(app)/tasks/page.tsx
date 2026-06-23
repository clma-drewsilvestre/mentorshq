import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchTasks } from "@/lib/tasks-query";
import { TaskCard } from "@/components/task-card";
import { NewTaskDialog } from "./new-task-dialog";
import { BOARD_COLUMNS, TASK_STATUS_LABEL, isManagement } from "@/lib/constants";
import type { TaskWithMeta } from "@/lib/types";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const me = await requireProfile();
  const manager = isManagement(me.role);
  const tasks = await fetchTasks();

  // Team list for the assign dropdown (managers only).
  let team: { id: string; full_name: string; email: string }[] = [];
  if (manager) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    team = data ?? [];
  }

  // Group by status; Blocked first (floats to top for the huddle).
  const grouped = BOARD_COLUMNS.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-bone">{manager ? "Tasks" : "My tasks"}</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} total</p>
        </div>
        {manager && <NewTaskDialog team={team} />}
      </div>

      {grouped.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {manager ? "No tasks yet. Create the first one." : "No tasks assigned to you yet."}
        </p>
      )}

      {grouped.map((group) => (
        <section key={group.status} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2
              className={
                group.status === "blocked"
                  ? "text-sm font-semibold uppercase tracking-wide text-destructive"
                  : "text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              }
            >
              {TASK_STATUS_LABEL[group.status]}
            </h2>
            <span className="text-xs text-muted-foreground">({group.items.length})</span>
          </div>
          <div className="space-y-2">
            {group.items.map((task: TaskWithMeta) => (
              <TaskCard key={task.id} task={task} showAssignee={manager} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
