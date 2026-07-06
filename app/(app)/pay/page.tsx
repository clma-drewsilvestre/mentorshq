import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClockButtons } from "./clock-buttons";
import { NewPayslipDialog } from "./new-payslip-dialog";
import { IssuePayslipButton } from "./issue-payslip-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { localDateISO } from "@/lib/periods";
import {
  isManagement,
  isViewer,
  isBoard,
  ATTENDANCE_STATUS_LABEL,
  type AttendanceStatus,
  type PayslipStatus,
} from "@/lib/constants";

export const metadata = { title: "Pay" };

type AttendanceRow = {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: AttendanceStatus;
  late_minutes: number;
  author: { full_name: string } | null;
};

type PayslipRow = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  basic: number;
  deductions_total: number;
  net: number;
  status: PayslipStatus;
  author: { full_name: string } | null;
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  on_time: "text-foreground",
  late: "text-copper",
  absent: "text-destructive",
  leave: "text-muted-foreground",
};

export default async function PayPage() {
  const me = await requireProfile();
  const canManage = isManagement(me.role);
  const canViewTeam = isViewer(me.role); // managers + board
  const isOperator = !isBoard(me.role); // board never clocks in

  const supabase = await createClient();
  const today = localDateISO();

  const [myTodayRes, attendanceRes, payslipsRes, teamRes] = await Promise.all([
    isOperator
      ? supabase
          .from("attendance")
          .select("time_in, time_out")
          .eq("user_id", me.id)
          .eq("date", today)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    canViewTeam
      ? supabase
          .from("attendance")
          .select("*, author:profiles!attendance_user_id_fkey(full_name)")
          .order("date", { ascending: false })
          .limit(30)
      : supabase
          .from("attendance")
          .select("*, author:profiles!attendance_user_id_fkey(full_name)")
          .eq("user_id", me.id)
          .order("date", { ascending: false })
          .limit(14),
    canViewTeam
      ? supabase
          .from("payslips")
          .select("*, author:profiles!payslips_user_id_fkey(full_name)")
          .order("period_start", { ascending: false })
      : supabase
          .from("payslips")
          .select("*, author:profiles!payslips_user_id_fkey(full_name)")
          .eq("user_id", me.id)
          .order("period_start", { ascending: false }),
    canManage
      ? supabase.from("profiles").select("id, full_name, email, base_salary").order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

  const myToday = myTodayRes.data as { time_in: string | null; time_out: string | null } | null;
  const attendance = (attendanceRes.data as AttendanceRow[] | null) ?? [];
  const payslips = (payslipsRes.data as PayslipRow[] | null) ?? [];
  const team = (teamRes.data as { id: string; full_name: string; email: string; base_salary: number }[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-bone">Pay</h1>
        <p className="text-sm text-muted-foreground">Attendance and payroll.</p>
      </div>

      {isOperator && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ClockButtons hasTimeIn={Boolean(myToday?.time_in)} hasTimeOut={Boolean(myToday?.time_out)} />
          </CardContent>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {canViewTeam ? "Team attendance" : "My attendance"}
        </h2>
        {attendance.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
        )}
        <div className="space-y-2">
          {attendance.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">
                  {fmtDate(a.date)}
                  {canViewTeam && a.author?.full_name && (
                    <span className="ml-2 font-normal text-muted-foreground">{a.author.full_name}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtTime(a.time_in)} – {fmtTime(a.time_out)}
                </p>
              </div>
              <span className={`text-xs font-medium ${STATUS_CLASS[a.status]}`}>
                {ATTENDANCE_STATUS_LABEL[a.status]}
                {a.status === "late" && a.late_minutes > 0 ? ` (${a.late_minutes}m)` : ""}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {canViewTeam ? "Payroll" : "My payslips"}
          </h2>
          {canManage && <NewPayslipDialog team={team} />}
        </div>
        {payslips.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No payslips yet.</p>
        )}
        <div className="space-y-2">
          {payslips.map((p) => (
            <Card key={p.id} className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                  </p>
                  {canViewTeam && p.author?.full_name && (
                    <p className="text-xs text-muted-foreground">{p.author.full_name}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={p.status === "issued" ? "border-gold/50 text-gold" : "border-border text-muted-foreground"}
                >
                  {p.status === "issued" ? "Issued" : "Draft"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <p className="text-foreground">{peso(p.basic)}</p>
                  <p>Basic</p>
                </div>
                <div>
                  <p className="text-foreground">−{peso(p.deductions_total)}</p>
                  <p>Deductions</p>
                </div>
                <div>
                  <p className="font-medium text-gold">{peso(p.net)}</p>
                  <p>Net</p>
                </div>
              </div>
              {me.role === "founder" && p.status === "draft" && (
                <IssuePayslipButton payslipId={p.id} />
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
