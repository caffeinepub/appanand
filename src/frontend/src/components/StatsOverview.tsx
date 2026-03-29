import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { DutyEntry } from "../backend.d";

interface StatsOverviewProps {
  entries: DutyEntry[];
  onLogNew: () => void;
}

function getOpt<T>(
  opt: { __kind__: string; value?: T } | null | undefined,
): T | null {
  if (!opt || opt.__kind__ !== "Some") return null;
  return (opt as { __kind__: "Some"; value: T }).value;
}

function getFYLabel(date: Date): string {
  const month = date.getMonth(); // 0-indexed, April = 3
  const year = date.getFullYear();
  if (month >= 3) {
    return `FY ${year}-${String(year + 1).slice(2)}`;
  }
  return `FY ${year - 1}-${String(year).slice(2)}`;
}

function getCurrentFY(): string {
  return getFYLabel(new Date());
}

function isInFY(date: Date, fy: string): boolean {
  const yearStr = fy.replace("FY ", "");
  const startYear = Number.parseInt(yearStr.split("-")[0]);
  const start = new Date(startYear, 3, 1);
  const end = new Date(startYear + 1, 3, 0, 23, 59, 59); // March 31
  return date >= start && date <= end;
}

export function StatsOverview({ entries, onLogNew }: StatsOverviewProps) {
  const currentFY = getCurrentFY();
  const [selectedFY, setSelectedFY] = useState<string>("all");

  // Build FY list from entries with credit dates + current FY
  const fySet = new Set<string>([currentFY]);
  for (const e of entries) {
    const creditDate = getOpt<bigint>(e.remunerationCreditDate as any);
    if (creditDate !== null) {
      const d = new Date(Number(creditDate) / 1_000_000);
      fySet.add(getFYLabel(d));
    }
  }
  const fyOptions = Array.from(fySet).sort().reverse();

  // Stats
  const totalEntries = entries.length;

  const remunerationCredited = entries
    .filter((e) => {
      const creditDate = getOpt<bigint>(e.remunerationCreditDate as any);
      if (creditDate === null) return false;
      if (selectedFY === "all") return true;
      const d = new Date(Number(creditDate) / 1_000_000);
      return isInFY(d, selectedFY);
    })
    .reduce((sum, e) => sum + Number(e.remunerationAmount), 0);

  const remunerationPending = entries
    .filter((e) => getOpt<bigint>(e.remunerationCreditDate as any) === null)
    .reduce((sum, e) => sum + Number(e.remunerationAmount), 0);

  const taCredited = entries
    .filter((e) => {
      if (!e.taEligible) return false;
      return getOpt<boolean>(e.taCredited as any) === true;
    })
    .reduce((sum, e) => {
      const amt = getOpt<number>(e.taAmount as any);
      return sum + (amt ?? 0);
    }, 0);

  const taPending = entries
    .filter((e) => {
      if (!e.taEligible) return false;
      return getOpt<boolean>(e.taCredited as any) !== true;
    })
    .reduce((sum, e) => {
      const amt = getOpt<number>(e.taAmount as any);
      return sum + (amt ?? 0);
    }, 0);

  const stats = [
    {
      label: "Total Entries",
      value: totalEntries,
      icon: Briefcase,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      accent: "",
    },
    {
      label:
        selectedFY === "all"
          ? "Remuneration Credited"
          : `Remuneration Credited (${selectedFY})`,
      value: `₹${remunerationCredited.toLocaleString("en-IN")}`,
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      accent: "border-l-2 border-l-emerald-500",
      fyBadge: true,
    },
    {
      label: "Remuneration Pending",
      value: `₹${remunerationPending.toLocaleString("en-IN")}`,
      icon: Clock,
      bg: "bg-amber-500/10",
      iconColor: "text-amber-600",
      accent: "border-l-2 border-l-amber-500",
    },
    {
      label: "TA Credited",
      value: `₹${taCredited.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      accent: "border-l-2 border-l-emerald-500",
    },
    {
      label: "TA Pending",
      value: `₹${taPending.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      bg: "bg-orange-500/10",
      iconColor: "text-orange-600",
      accent: "border-l-2 border-l-orange-500",
    },
    {
      label: "TA Credited Count",
      value: entries.filter(
        (e) => e.taEligible && getOpt<boolean>(e.taCredited as any) === true,
      ).length,
      icon: CreditCard,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      accent: "",
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Your Duty Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Summary of all recorded duty entries
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Filter by FY:
            </span>
            <Select value={selectedFY} onValueChange={setSelectedFY}>
              <SelectTrigger
                className="h-8 w-32 text-xs"
                data-ocid="duty.select"
              >
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {fyOptions.map((fy) => (
                  <SelectItem key={fy} value={fy}>
                    {fy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={onLogNew}
            data-ocid="duty.primary_button"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span> Log New Duty
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3 p-4 rounded-xl border border-border ${stat.accent ?? ""}`}
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}
            >
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground truncate">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
