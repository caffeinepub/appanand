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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UpcomingDuty } from "../backend.d";
import {
  useDeleteUpcomingDuty,
  useMarkUpcomingDutyCompleted,
  useMarkUpcomingDutyMissed,
} from "../hooks/useQueries";

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

function nanoToDateOnly(nano: bigint): string {
  const ms = Number(nano) / 1_000_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type TimeTag =
  | "Today"
  | "Tomorrow"
  | "This Week"
  | "Next Week"
  | "Later"
  | "Overdue";

function getTimeTag(dutyDateStr: string, today: string): TimeTag {
  if (dutyDateStr === today) return "Today";
  if (dutyDateStr < today) return "Overdue";
  if (dutyDateStr === addDays(today, 1)) return "Tomorrow";

  // Find Monday of current week
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const dutyDate = new Date(dutyDateStr);
  if (dutyDate <= sunday) return "This Week";

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  if (dutyDate >= nextMonday && dutyDate <= nextSunday) return "Next Week";

  return "Later";
}

const TIME_TAG_STYLES: Record<
  TimeTag,
  { row: string; badge: string; label: string }
> = {
  Today: {
    row: "bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-400",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-0",
    label: "Today",
  },
  Tomorrow: {
    row: "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-400",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-0",
    label: "Tomorrow",
  },
  "This Week": {
    row: "bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-400",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-0",
    label: "This Week",
  },
  "Next Week": {
    row: "bg-violet-50 dark:bg-violet-950/20 border-l-4 border-l-violet-400",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border-0",
    label: "Next Week",
  },
  Later: {
    row: "hover:bg-muted/20",
    badge: "bg-muted text-muted-foreground border-0",
    label: "Later",
  },
  Overdue: {
    row: "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-400",
    badge:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-0",
    label: "Overdue",
  },
};

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

function StatusBadge({ status }: { status: string }) {
  if (status === "Scheduled")
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs border-0">
        Scheduled
      </Badge>
    );
  if (status === "Completed")
    return (
      <Badge className="bg-success text-success-foreground text-xs border-0">
        Completed
      </Badge>
    );
  return (
    <Badge className="bg-destructive/10 text-destructive text-xs border-0">
      Missed
    </Badge>
  );
}

interface CompletionDialogProps {
  entry: UpcomingDuty | null;
  onClose: () => void;
}

function CompletionDialog({ entry, onClose }: CompletionDialogProps) {
  const completedMutation = useMarkUpcomingDutyCompleted();
  const missedMutation = useMarkUpcomingDutyMissed();

  const handleYes = async () => {
    if (!entry) return;
    try {
      await completedMutation.mutateAsync(entry.id);
      toast.success("Duty marked as completed and copied to Other Duties");
      onClose();
    } catch {
      toast.error("Failed to mark duty as completed");
    }
  };

  const handleNo = async () => {
    if (!entry) return;
    try {
      await missedMutation.mutateAsync(entry.id);
      toast.success("Duty marked as missed");
      onClose();
    } catch {
      toast.error("Failed to mark duty as missed");
    }
  };

  const isPending = completedMutation.isPending || missedMutation.isPending;

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-ocid="upcoming.dialog">
        <DialogHeader>
          <DialogTitle>Did you complete this duty?</DialogTitle>
          <DialogDescription>
            {entry
              ? `${entry.workType} — ${entry.dutyRole} on ${formatDate(entry.dutyDate)}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:flex-row flex-col">
          <Button
            variant="outline"
            data-ocid="upcoming.cancel_button"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            data-ocid="upcoming.confirm_button"
            onClick={handleNo}
            disabled={isPending}
          >
            {missedMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            No — Mark as Missed ✗
          </Button>
          <Button
            data-ocid="upcoming.primary_button"
            onClick={handleYes}
            disabled={isPending}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {completedMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Yes — Completed ✓
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduledDutiesTable({
  entries,
  isLoading,
  onEdit,
  onMarkComplete,
  onDelete,
}: {
  entries: UpcomingDuty[];
  isLoading: boolean;
  onEdit: (e: UpcomingDuty) => void;
  onMarkComplete: (e: UpcomingDuty) => void;
  onDelete: (id: bigint) => void;
}) {
  const today = getTodayStr();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-xs font-semibold">When</TableHead>
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
            <TableHead className="text-xs font-semibold">Reminder</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            SKELETON_ROWS.map((rowKey) => (
              <TableRow key={rowKey} data-ocid="upcoming.loading_state">
                {SKELETON_COLS.map((colKey) => (
                  <TableCell key={colKey}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center py-12"
                data-ocid="upcoming.empty_state"
              >
                <p className="text-sm text-muted-foreground">
                  No upcoming duties scheduled
                </p>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, idx) => {
              const centreOfDuty = getOpt<string>(entry.centreOfDuty as any);
              const dutyDateStr = nanoToDateOnly(entry.dutyDate);
              const tag = getTimeTag(dutyDateStr, today);
              const styles = TIME_TAG_STYLES[tag];
              return (
                <TableRow
                  key={String(entry.id)}
                  data-ocid={`upcoming.item.${idx + 1}`}
                  className={styles.row}
                >
                  <TableCell className="text-sm">
                    <Badge className={`text-xs font-semibold ${styles.badge}`}>
                      {styles.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatDate(entry.dutyDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.reportingTime || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{entry.workType}</TableCell>
                  <TableCell className="text-sm">{entry.dutyRole}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {centreOfDuty ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.orderNumber || "—"}
                  </TableCell>
                  <TableCell>
                    {entry.reminderEnabled ? (
                      <Bell className="w-4 h-4 text-primary" />
                    ) : (
                      <BellOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {entry.status === "Scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onMarkComplete(entry)}
                          className="h-7 w-7 text-muted-foreground hover:text-success"
                          title="Mark Complete / Missed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`upcoming.edit_button.${idx + 1}`}
                        onClick={() => onEdit(entry)}
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`upcoming.delete_button.${idx + 1}`}
                        onClick={() => onDelete(entry.id)}
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
  );
}

function MissedDutiesTable({
  entries,
  isLoading,
  onEdit,
  onDelete,
}: {
  entries: UpcomingDuty[];
  isLoading: boolean;
  onEdit: (e: UpcomingDuty) => void;
  onDelete: (id: bigint) => void;
}) {
  return (
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
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            SKELETON_ROWS.map((rowKey) => (
              <TableRow key={rowKey}>
                {["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map((c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  No missed duties
                </p>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, idx) => {
              const centreOfDuty = getOpt<string>(entry.centreOfDuty as any);
              return (
                <TableRow
                  key={String(entry.id)}
                  data-ocid={`upcoming.item.${idx + 1}`}
                  className="hover:bg-muted/20"
                >
                  <TableCell className="text-sm font-medium">
                    {formatDate(entry.dutyDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.reportingTime || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{entry.workType}</TableCell>
                  <TableCell className="text-sm">{entry.dutyRole}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {centreOfDuty ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.orderNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`upcoming.edit_button.${idx + 1}`}
                        onClick={() => onEdit(entry)}
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`upcoming.delete_button.${idx + 1}`}
                        onClick={() => onDelete(entry.id)}
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
  );
}

interface UpcomingDutyTableProps {
  entries: UpcomingDuty[];
  isLoading: boolean;
  onEdit: (entry: UpcomingDuty) => void;
  onAddNew?: () => void;
}

export function UpcomingDutyTable({
  entries,
  isLoading,
  onEdit,
  onAddNew,
}: UpcomingDutyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [completionTarget, setCompletionTarget] = useState<UpcomingDuty | null>(
    null,
  );
  const deleteMutation = useDeleteUpcomingDuty();

  const today = getTodayStr();

  // Scheduled = today + future (sorted by date)
  const scheduledEntries = entries
    .filter((e) => e.status === "Scheduled")
    .sort((a, b) => Number(a.dutyDate - b.dutyDate));

  const missedEntries = entries.filter((e) => e.status === "Missed");
  const completedEntries = entries.filter((e) => e.status === "Completed");

  const todayCount = scheduledEntries.filter(
    (e) => nanoToDateOnly(e.dutyDate) === today,
  ).length;

  const handleDeleteConfirm = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success("Duty deleted successfully");
    } catch {
      toast.error("Failed to delete duty");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Upcoming Duties
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scheduledEntries.length} scheduled
              {todayCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold dark:bg-amber-900/50 dark:text-amber-200">
                  {todayCount} today
                </span>
              )}
            </p>
          </div>
          {onAddNew && (
            <Button
              size="sm"
              onClick={onAddNew}
              data-ocid="upcoming.open_modal_button"
              className="h-8 text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Duty
            </Button>
          )}
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(
            [
              { tag: "Today", style: TIME_TAG_STYLES.Today },
              { tag: "Tomorrow", style: TIME_TAG_STYLES.Tomorrow },
              { tag: "This Week", style: TIME_TAG_STYLES["This Week"] },
              { tag: "Next Week", style: TIME_TAG_STYLES["Next Week"] },
              { tag: "Later", style: TIME_TAG_STYLES.Later },
            ] as const
          ).map(({ tag, style }) => (
            <span
              key={tag}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="scheduled" className="p-4">
        <TabsList data-ocid="upcoming.tab">
          <TabsTrigger
            value="scheduled"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            🗓️ Scheduled ({scheduledEntries.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            ✅ Completed ({completedEntries.length})
          </TabsTrigger>
          <TabsTrigger
            value="missed"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            ❌ Missed ({missedEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-4">
          <ScheduledDutiesTable
            entries={scheduledEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onMarkComplete={setCompletionTarget}
            onDelete={setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <MissedDutiesTable
            entries={completedEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          <MissedDutiesTable
            entries={missedEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>
      </Tabs>

      <CompletionDialog
        entry={completionTarget}
        onClose={() => setCompletionTarget(null)}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="upcoming.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upcoming Duty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this upcoming duty? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="upcoming.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="upcoming.confirm_button"
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
