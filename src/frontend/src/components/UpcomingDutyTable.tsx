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

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3"];
const SKELETON_COLS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

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

function DutyRowsTable({
  entries,
  isLoading,
  onEdit,
  onMarkComplete,
  onDelete,
  emptyMessage,
}: {
  entries: UpcomingDuty[];
  isLoading: boolean;
  onEdit: (e: UpcomingDuty) => void;
  onMarkComplete: (e: UpcomingDuty) => void;
  onDelete: (id: bigint) => void;
  emptyMessage: string;
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
                colSpan={8}
                className="text-center py-12"
                data-ocid="upcoming.empty_state"
              >
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, idx) => (
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
                        data-ocid={`upcoming.edit_button.${idx + 1}`}
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
            ))
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
}

export function UpcomingDutyTable({
  entries,
  isLoading,
  onEdit,
}: UpcomingDutyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [completionTarget, setCompletionTarget] = useState<UpcomingDuty | null>(
    null,
  );
  const deleteMutation = useDeleteUpcomingDuty();

  const today = getTodayStr();

  const todayEntries = entries.filter(
    (e) => nanoToDateOnly(e.dutyDate) === today,
  );
  const upcomingEntries = entries.filter(
    (e) => e.status === "Scheduled" && nanoToDateOnly(e.dutyDate) > today,
  );
  const missedEntries = entries.filter((e) => e.status === "Missed");

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
        <h2 className="text-lg font-bold text-foreground">Upcoming Duties</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entries.length} duties scheduled
        </p>
      </div>

      <Tabs defaultValue="today" className="p-4">
        <TabsList data-ocid="upcoming.tab">
          <TabsTrigger
            value="today"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            📅 Today ({todayEntries.length})
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            🗓️ Upcoming ({upcomingEntries.length})
          </TabsTrigger>
          <TabsTrigger
            value="missed"
            data-ocid="upcoming.tab"
            className="text-xs"
          >
            ❌ Missed ({missedEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <DutyRowsTable
            entries={todayEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onMarkComplete={setCompletionTarget}
            onDelete={setDeleteTarget}
            emptyMessage="No duties scheduled for today"
          />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <DutyRowsTable
            entries={upcomingEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onMarkComplete={setCompletionTarget}
            onDelete={setDeleteTarget}
            emptyMessage="No upcoming duties scheduled"
          />
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          <DutyRowsTable
            entries={missedEntries}
            isLoading={isLoading}
            onEdit={onEdit}
            onMarkComplete={setCompletionTarget}
            onDelete={setDeleteTarget}
            emptyMessage="No missed duties"
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
