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
import { Edit2, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LeaveEntry } from "../backend.d";
import { useDeleteLeaveEntry } from "../hooks/useQueries";
import { getStorageClient } from "../utils/storageUtils";

function getOpt<T>(opt: { __kind__: string; value?: T }): T | null {
  if (opt.__kind__ === "Some") return opt.value as T;
  return null;
}

function nanoToDate(nano: bigint): Date {
  return new Date(Number(nano) / 1_000_000);
}

function formatDate(nano: bigint | null): string {
  if (!nano) return "—";
  return nanoToDate(nano).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function computeExpiry(entry: LeaveEntry): Date | null {
  if (entry.leaveType === "CompOff") {
    const hdd = getOpt(entry.holidayDutyDate);
    if (!hdd) return null;
    return addMonths(nanoToDate(hdd), 3);
  }
  const sd = getOpt(entry.sanctionedDate);
  if (!sd) return null;
  return addMonths(nanoToDate(sd), 12);
}

function formatExpiryDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function UseBeforeBadge({ entry }: { entry: LeaveEntry }) {
  if (entry.availed)
    return <span className="text-muted-foreground text-xs">—</span>;
  const expiry = computeExpiry(entry);
  if (!expiry) return <span className="text-muted-foreground text-xs">—</span>;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  exp.setHours(0, 0, 0, 0);
  const days = Math.ceil(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const label = formatExpiryDate(expiry);
  if (days <= 0)
    return (
      <Badge variant="destructive" className="text-xs">
        Expired
      </Badge>
    );
  if (days < 14)
    return (
      <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
        Use by {label}
      </Badge>
    );
  if (days < 30)
    return (
      <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
        Use by {label}
      </Badge>
    );
  return (
    <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      Use by {label}
    </Badge>
  );
}

interface LeaveTableProps {
  entries: LeaveEntry[];
  isLoading: boolean;
  onEdit: (entry: LeaveEntry) => void;
  onAddNew?: () => void;
}

export function LeaveTable({
  entries,
  isLoading,
  onEdit,
  onAddNew,
}: LeaveTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<LeaveEntry | null>(null);
  const deleteMutation = useDeleteLeaveEntry();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleViewDocument = async (hash: string) => {
    try {
      const client = await getStorageClient();
      const url = await client.getDirectURL(hash);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to open document");
    }
  };

  const available = entries.filter((e) => {
    if (e.availed) return false;
    const exp = computeExpiry(e);
    if (!exp) return false;
    return exp.getTime() > Date.now();
  });
  const used = entries.filter((e) => e.availed);
  const pending = entries.filter((e) => !e.availed);

  const renderRows = (list: LeaveEntry[], startIdx = 0) => {
    if (list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-10">
            <div
              data-ocid="leave.empty_state"
              className="flex flex-col items-center gap-2"
            >
              <p className="text-sm text-muted-foreground">No entries found</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return list.map((entry, i) => {
      const idx = startIdx + i + 1;
      const refDateNano =
        entry.leaveType === "CompOff"
          ? getOpt(entry.holidayDutyDate)
          : getOpt(entry.sanctionedDate);
      const sanctionedOD = getOpt(entry.sanctionedOD);
      const docId = getOpt(entry.orderDocumentLeaveId);

      return (
        <TableRow key={String(entry.id)} data-ocid={`leave.item.${idx}`}>
          <TableCell>
            <Badge
              variant="outline"
              className={
                entry.leaveType === "CompOff"
                  ? "border-indigo-200 text-indigo-700 bg-indigo-100 text-xs"
                  : "border-violet-200 text-violet-700 bg-violet-100 text-xs"
              }
            >
              {entry.leaveType === "CompOff" ? "Comp Off" : "Unpunched OD"}
            </Badge>
          </TableCell>
          <TableCell className="text-sm font-medium">
            {entry.orderNumber || "—"}
          </TableCell>
          <TableCell className="text-sm">{formatDate(refDateNano)}</TableCell>
          <TableCell className="text-sm">
            {sanctionedOD !== null ? String(sanctionedOD) : "—"}
          </TableCell>
          <TableCell>
            <UseBeforeBadge entry={entry} />
          </TableCell>
          <TableCell>
            {entry.availed ? (
              <Badge className="text-xs bg-success/60 text-success-foreground border-success/40 hover:bg-success/60">
                Used
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                Pending
              </Badge>
            )}
          </TableCell>
          <TableCell className="text-sm max-w-[140px]">
            {entry.availed && entry.availedDates.length > 0
              ? entry.availedDates.map((d) => formatDate(d)).join(", ")
              : "—"}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              {docId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleViewDocument(docId)}
                  title="View document"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`leave.edit_button.${idx}`}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(entry)}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`leave.delete_button.${idx}`}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(entry)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  const tableHeader = (
    <TableHeader>
      <TableRow>
        <TableHead className="text-xs">Type</TableHead>
        <TableHead className="text-xs">Order No.</TableHead>
        <TableHead className="text-xs">Reference Date</TableHead>
        <TableHead className="text-xs">OD Count</TableHead>
        <TableHead className="text-xs">Use Before</TableHead>
        <TableHead className="text-xs">Status</TableHead>
        <TableHead className="text-xs">Availed Date(s)</TableHead>
        <TableHead className="text-xs">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderSkeleton = () => (
    <TableRow>
      <TableCell colSpan={8}>
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Leave Records
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entries.length} total entries
              </p>
            </div>
            {onAddNew && (
              <Button
                size="sm"
                onClick={onAddNew}
                data-ocid="leave.open_modal_button"
                className="h-8 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Leave Entry
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="p-4">
          <TabsList className="mb-4" data-ocid="leave.tab">
            <TabsTrigger value="all" data-ocid="leave.tab">
              All Records
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {entries.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="available" data-ocid="leave.tab">
              Available
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {available.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="used" data-ocid="leave.tab">
              Used
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {used.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" data-ocid="leave.tab">
              Pending Credits
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {pending.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {(["all", "available", "used", "pending"] as const).map((tab) => {
            const list =
              tab === "all"
                ? entries
                : tab === "available"
                  ? available
                  : tab === "used"
                    ? used
                    : pending;
            return (
              <TabsContent key={tab} value={tab}>
                <div className="overflow-x-auto">
                  <Table>
                    {tableHeader}
                    <TableBody>
                      {isLoading ? renderSkeleton() : renderRows(list)}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="leave.dialog">
          <DialogHeader>
            <DialogTitle>Delete Leave Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              {deleteTarget?.leaveType === "CompOff"
                ? "Comp Off"
                : "Unpunched OD"}{" "}
              entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="leave.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="leave.delete_button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
