import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { LeaveEntry } from "../backend.d";

const COMP_OFF_YEARLY_LIMIT = 15;

function getOpt<T>(
  opt: { __kind__: "Some"; value: T } | { __kind__: "None" },
): T | null {
  if (opt.__kind__ === "Some")
    return (opt as { __kind__: "Some"; value: T }).value;
  return null;
}

function nanoToDate(nano: bigint): Date {
  return new Date(Number(nano) / 1_000_000);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isExpired(entry: LeaveEntry): boolean {
  const now = new Date();
  if (entry.leaveType === "CompOff") {
    const hdd = getOpt(entry.holidayDutyDate);
    if (!hdd) return true;
    return addMonths(nanoToDate(hdd), 3) < now;
  }
  const sd = getOpt(entry.sanctionedDate);
  if (!sd) return true;
  return addMonths(nanoToDate(sd), 12) < now;
}

interface LeaveStatsProps {
  entries: LeaveEntry[];
}

export function LeaveStats({ entries }: LeaveStatsProps) {
  const now = new Date();
  const thisYear = now.getFullYear();

  // Comp Off used this calendar year
  const compOffUsedThisYear = entries.filter((e) => {
    if (e.leaveType !== "CompOff" || !e.availed) return false;
    return e.availedDates.some((d) => {
      const date = nanoToDate(d);
      return date.getFullYear() === thisYear;
    });
  }).length;

  // Comp Off available (not availed + not expired)
  const compOffAvailable = entries.filter(
    (e) => e.leaveType === "CompOff" && !e.availed && !isExpired(e),
  ).length;

  // Unpunched OD total sanctioned (sum of sanctionedOD)
  const odTotalSanctioned = entries
    .filter((e) => e.leaveType === "UnpunchedOD")
    .reduce((sum, e) => {
      const n = getOpt(e.sanctionedOD);
      return sum + (n !== null ? Number(n) : 0);
    }, 0);

  // Unpunched OD available (not availed, not expired)
  const odAvailable = entries
    .filter((e) => e.leaveType === "UnpunchedOD" && !e.availed && !isExpired(e))
    .reduce((sum, e) => {
      const n = getOpt(e.sanctionedOD);
      return sum + (n !== null ? Number(n) : 0);
    }, 0);

  const compOffPct = Math.min(
    100,
    Math.round((compOffUsedThisYear / COMP_OFF_YEARLY_LIMIT) * 100),
  );
  const nearLimit = compOffUsedThisYear >= 12;
  const atLimit = compOffUsedThisYear >= COMP_OFF_YEARLY_LIMIT;

  const stats = [
    {
      title: "Comp Off Used (This Year)",
      icon: CalendarCheck,
      color: atLimit
        ? "text-destructive"
        : nearLimit
          ? "text-orange-500"
          : "text-primary",
      bgColor: atLimit
        ? "bg-destructive/10"
        : nearLimit
          ? "bg-orange-500/10"
          : "bg-primary/10",
      value: `${compOffUsedThisYear} / ${COMP_OFF_YEARLY_LIMIT}`,
      sub: (
        <div className="mt-2 space-y-1">
          <Progress value={compOffPct} className="h-1.5" />
          {atLimit && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" /> Annual limit reached
            </div>
          )}
          {nearLimit && !atLimit && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <AlertCircle className="w-3 h-3" /> Approaching annual limit
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Comp Off Available",
      icon: Clock,
      color: "text-success-foreground",
      bgColor: "bg-success/60",
      value: compOffAvailable,
      sub: (
        <p className="text-xs text-muted-foreground mt-1">
          Not yet availed &amp; valid
        </p>
      ),
    },
    {
      title: "Unpunched OD Sanctioned",
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
      value: odTotalSanctioned,
      sub: (
        <p className="text-xs text-muted-foreground mt-1">
          Total ODs granted (all time)
        </p>
      ),
    },
    {
      title: "Unpunched OD Available",
      icon: CheckCircle2,
      color: "text-success-foreground",
      bgColor: "bg-success/60",
      value: odAvailable,
      sub: (
        <p className="text-xs text-muted-foreground mt-1">
          Pending avail, within validity
        </p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.title} className="shadow-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {s.title}
              </CardTitle>
              <div className={`p-1.5 rounded-md ${s.bgColor}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { Badge };
