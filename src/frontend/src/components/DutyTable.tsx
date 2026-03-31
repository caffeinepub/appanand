import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DutyEntry } from "../backend.d";
import { useDeleteDutyEntry } from "../hooks/useQueries";

function getOpt<T>(opt: { __kind__: string; value?: T }): T | null {
  if (opt.__kind__ === "Some")
    return (opt as { __kind__: "Some"; value: T }).value;
  return null;
}

function formatDate(nano: bigint): string {
  const ms = Number(nano) / 1_000_000;
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3"];
const SKELETON_COLS = [
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "c10",
  "c11",
];

const PAGE_SIZE = 15;

type ViewKey = "all" | "credited" | "pending" | "ta_pending" | "ta_credited";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "credited", label: "Credited" },
  { key: "pending", label: "Pending" },
  { key: "ta_pending", label: "TA Pending" },
  { key: "ta_credited", label: "TA Credited" },
];

function filterEntries(entries: DutyEntry[], view: ViewKey): DutyEntry[] {
  switch (view) {
    case "all":
      return entries;
    case "credited":
      return entries.filter(
        (e) => getOpt<bigint>(e.remunerationCreditDate as any) !== null,
      );
    case "pending":
      return entries.filter(
        (e) => getOpt<bigint>(e.remunerationCreditDate as any) === null,
      );
    case "ta_pending":
      return entries.filter(
        (e) => e.taEligible && getOpt<boolean>(e.taCredited as any) !== true,
      );
    case "ta_credited":
      return entries.filter(
        (e) => e.taEligible && getOpt<boolean>(e.taCredited as any) === true,
      );
    default:
      return entries;
  }
}

// FY is based on remuneration/TA credit date. Falls back to duty date if no credit date.
function getCreditDate(entry: DutyEntry): bigint {
  const remuCreditDate = getOpt<bigint>(entry.remunerationCreditDate as any);
  if (remuCreditDate !== null) return remuCreditDate;
  // fall back to duty date
  return entry.dutyDate;
}

function getFiscalYear(nano: bigint): string {
  const date = new Date(Number(nano) / 1_000_000);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  if (month >= 3) {
    return `FY ${year}-${String(year + 1).slice(2)}`;
  }
  return `FY ${year - 1}-${String(year).slice(2)}`;
}

function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `FY ${year}-${String(year + 1).slice(2)}`;
  }
  return `FY ${year - 1}-${String(year).slice(2)}`;
}

function getAvailableFYs(entries: DutyEntry[]): string[] {
  const fySet = new Set<string>();
  fySet.add(getCurrentFY());
  for (const e of entries) {
    fySet.add(getFiscalYear(getCreditDate(e)));
  }
  return Array.from(fySet).sort().reverse();
}

// Calendar year derived from credit date
function getCalendarYear(nano: bigint): number {
  return new Date(Number(nano) / 1_000_000).getFullYear();
}

function getAvailableYears(entries: DutyEntry[]): number[] {
  const yearSet = new Set<number>();
  yearSet.add(new Date().getFullYear());
  for (const e of entries) {
    yearSet.add(getCalendarYear(getCreditDate(e)));
  }
  return Array.from(yearSet).sort().reverse();
}

interface DutyTableProps {
  entries: DutyEntry[];
  isLoading: boolean;
  onEdit: (entry: DutyEntry) => void;
}

export function DutyTable({ entries, isLoading, onEdit }: DutyTableProps) {
  const [activeView, setActiveView] = useState<ViewKey>("all");
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [selectedFY, setSelectedFY] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const deleteMutation = useDeleteDutyEntry();

  const handleDeleteConfirm = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success("Entry deleted successfully");
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setDeleteTarget(null);
    }
  };

  // FY filter by credit date
  const fyFilteredEntries =
    selectedFY === "all"
      ? entries
      : entries.filter((e) => getFiscalYear(getCreditDate(e)) === selectedFY);

  // Year filter by credit date
  const yearFilteredEntries =
    selectedYear === "all"
      ? fyFilteredEntries
      : fyFilteredEntries.filter(
          (e) => String(getCalendarYear(getCreditDate(e))) === selectedYear,
        );

  const viewFilteredEntries = filterEntries(yearFilteredEntries, activeView);
  const availableFYs = getAvailableFYs(entries);
  const availableYears = getAvailableYears(entries);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(viewFilteredEntries.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEntries = viewFilteredEntries.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Your Duty Entries
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewFilteredEntries.length} of {entries.length} entries shown
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedFY}
              onValueChange={handleFilterChange(setSelectedFY)}
            >
              <SelectTrigger
                className="w-36 h-8 text-xs"
                data-ocid="duty.select"
              >
                <SelectValue placeholder="Financial Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All FY
                </SelectItem>
                {availableFYs.map((fy) => (
                  <SelectItem key={fy} value={fy} className="text-xs">
                    {fy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear}
              onValueChange={handleFilterChange(setSelectedYear)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Calendar Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Years
                </SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View filter pills */}
        <div className="flex flex-wrap gap-2 mt-3" data-ocid="duty.tab">
          {VIEWS.map((v) => {
            const count = filterEntries(yearFilteredEntries, v.key).length;
            const isActive = activeView === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setActiveView(v.key);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {v.label}
                <span
                  className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row colour legend */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-2 border-b border-border bg-muted/20 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
          Remuneration Credited
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
          TA Credited
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-white border border-border" />
          Plain Duty
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">
                Reporting Time
              </TableHead>
              <TableHead className="text-xs font-semibold">Work Type</TableHead>
              <TableHead className="text-xs font-semibold">Role</TableHead>
              <TableHead className="text-xs font-semibold">
                Centre of Duty
              </TableHead>
              <TableHead className="text-xs font-semibold">Order No</TableHead>
              <TableHead className="text-xs font-semibold">
                Remun. (₹)
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Remun. Credited
              </TableHead>
              <TableHead className="text-xs font-semibold">
                TA Eligible
              </TableHead>
              <TableHead className="text-xs font-semibold">TA Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((rowKey) => (
                <TableRow key={rowKey} data-ocid="duty.loading_state">
                  {SKELETON_COLS.map((colKey) => (
                    <TableCell key={colKey}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-12"
                  data-ocid="duty.empty_state"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="text-sm font-medium">
                      {activeView === "all"
                        ? "No duty entries yet"
                        : "No entries in this view"}
                    </p>
                    <p className="text-xs">
                      {activeView === "all"
                        ? "Add your first entry using Log New Duty"
                        : "Try switching to a different view"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry, idx) => {
                const taStatus = getOpt<string>(
                  entry.taSubmissionStatus as any,
                );
                const isTaSubmitted = taStatus === "Submitted";
                const reportingTime = getOpt(entry.reportingTime as any);
                const creditDate = getOpt<bigint>(
                  entry.remunerationCreditDate as any,
                );
                const taCreditedVal = getOpt<boolean>(entry.taCredited as any);
                const centreOfDuty = getOpt<string>(entry.centreOfDuty as any);
                return (
                  <TableRow
                    key={String(entry.id)}
                    data-ocid={`duty.item.${idx + 1}`}
                    className={`${
                      creditDate !== null
                        ? "bg-green-50 hover:bg-green-100/70"
                        : taCreditedVal === true
                          ? "bg-blue-50 hover:bg-blue-100/70"
                          : "hover:bg-muted/20"
                    }`}
                  >
                    <TableCell className="text-sm font-medium">
                      {formatDate(entry.dutyDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {String(reportingTime ?? "—")}
                    </TableCell>
                    <TableCell className="text-sm">{entry.workType}</TableCell>
                    <TableCell className="text-sm">{entry.dutyRole}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {centreOfDuty ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.orderNo || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      ₹
                      {Number(entry.remunerationAmount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {creditDate !== null ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge className="bg-emerald-500/15 text-emerald-700 text-xs border-0 w-fit">
                            Credited
                          </Badge>
                          <span className="text-[10px] font-bold text-foreground">
                            {formatDate(creditDate)}
                          </span>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-600 border-amber-300"
                        >
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.taEligible ? (
                        <Badge className="bg-primary/10 text-primary text-xs border-0">
                          Yes
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.taEligible ? (
                        taCreditedVal === true ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 text-xs border-0">
                            TA Credited
                          </Badge>
                        ) : (
                          <Badge
                            className={`text-xs border-0 ${
                              isTaSubmitted
                                ? "bg-blue-500/10 text-blue-700"
                                : "bg-amber-500/10 text-amber-700"
                            }`}
                          >
                            {taStatus ?? "Not Submitted"}
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`duty.edit_button.${idx + 1}`}
                          onClick={() => onEdit(entry)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`duty.delete_button.${idx + 1}`}
                          onClick={() => setDeleteTarget(entry.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages} &mdash; {viewFilteredEntries.length}{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
              )
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1)
                  acc.push(`ellipsis-before-${p}`);
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span
                    key={item}
                    className="text-xs text-muted-foreground px-1"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item as number}
                    variant={safePage === item ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setCurrentPage(item as number)}
                  >
                    {item}
                  </Button>
                ),
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="duty.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Duty Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this duty entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="duty.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="duty.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
