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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
];

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

interface DutyTableProps {
  entries: DutyEntry[];
  isLoading: boolean;
  onEdit: (entry: DutyEntry) => void;
}

export function DutyTable({ entries, isLoading, onEdit }: DutyTableProps) {
  const [activeView, setActiveView] = useState<ViewKey>("all");
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
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

  const filteredEntries = filterEntries(entries, activeView);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Your Duty Entries
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredEntries.length} of {entries.length} entries shown
            </p>
          </div>
        </div>

        {/* View filter pills */}
        <div className="flex flex-wrap gap-2 mt-3" data-ocid="duty.tab">
          {VIEWS.map((v) => {
            const count = filterEntries(entries, v.key).length;
            const isActive = activeView === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setActiveView(v.key)}
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
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
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
                        ? "Add your first entry using the form on the left"
                        : "Try switching to a different view"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, idx) => {
                const taStatus = getOpt<string>(
                  entry.taSubmissionStatus as any,
                );
                const isTaSubmitted = taStatus === "Submitted";
                const reportingTime = getOpt(entry.reportingTime as any);
                const creditDate = getOpt<bigint>(
                  entry.remunerationCreditDate as any,
                );
                const taCreditedVal = getOpt<boolean>(entry.taCredited as any);
                return (
                  <TableRow
                    key={String(entry.id)}
                    data-ocid={`duty.item.${idx + 1}`}
                    className="hover:bg-muted/20"
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
                          <span className="text-[10px] text-muted-foreground">
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
