import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { LeaveEntry, LeaveEntryInput, Option } from "../backend.d";
import { useAddLeaveEntry, useUpdateLeaveEntry } from "../hooks/useQueries";
import { getStorageClient } from "../utils/storageUtils";

function dateToNano(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

function someVal<T>(val: T): Option<T> {
  return { __kind__: "Some", value: val };
}

const noneVal: Option<never> = { __kind__: "None" } as Option<never>;

function getOpt<T>(opt: Option<T>): T | null {
  if (opt.__kind__ === "Some")
    return (opt as { __kind__: "Some"; value: T }).value;
  return null;
}

function nanoToDateStr(nano: bigint | null | undefined): string {
  if (!nano) return "";
  const ms = Number(nano) / 1_000_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function computeDaysLeft(leaveType: string, refDateStr: string): number | null {
  if (!refDateStr) return null;
  const refDate = new Date(refDateStr);
  if (Number.isNaN(refDate.getTime())) return null;
  if (leaveType === "CompOff") {
    return daysUntil(addMonths(refDate, 3));
  }
  return daysUntil(addMonths(refDate, 12));
}

let _uidCounter = 0;
function genId(): string {
  _uidCounter += 1;
  return String(_uidCounter);
}

interface DateField {
  id: string;
  value: string;
}

interface LeaveFormState {
  leaveType: string;
  holidayDutyDate: string;
  sanctionedDate: string;
  orderNumber: string;
  sanctionedOD: string;
  availed: boolean;
  availedDates: DateField[];
  orderDocumentLeaveId: string;
  orderDocumentName: string;
  remarks: string;
}

function makeEmptyForm(): LeaveFormState {
  return {
    leaveType: "CompOff",
    holidayDutyDate: "",
    sanctionedDate: "",
    orderNumber: "",
    sanctionedOD: "1",
    availed: false,
    availedDates: [{ id: genId(), value: "" }],
    orderDocumentLeaveId: "",
    orderDocumentName: "",
    remarks: "",
  };
}

interface LeaveFormProps {
  userId: bigint;
  editEntry: LeaveEntry | null;
  onCancelEdit: () => void;
  formRef?: React.RefObject<HTMLDivElement | null>;
  actorReady: boolean;
  onSuccess?: () => void;
}

export function LeaveForm({
  editEntry,
  onCancelEdit,
  formRef,
  userId,
  actorReady,
  onSuccess,
}: LeaveFormProps) {
  const [form, setForm] = useState<LeaveFormState>(() => {
    if (!editEntry) return makeEmptyForm();
    const sanctionedODNum = getOpt(editEntry.sanctionedOD);
    const availedDateFields: DateField[] =
      editEntry.availedDates.length > 0
        ? editEntry.availedDates.map((d) => ({
            id: genId(),
            value: nanoToDateStr(d),
          }))
        : [{ id: genId(), value: "" }];
    return {
      leaveType: editEntry.leaveType,
      holidayDutyDate: nanoToDateStr(getOpt(editEntry.holidayDutyDate) ?? null),
      sanctionedDate: nanoToDateStr(getOpt(editEntry.sanctionedDate) ?? null),
      orderNumber: editEntry.orderNumber,
      sanctionedOD: sanctionedODNum !== null ? String(sanctionedODNum) : "1",
      availed: editEntry.availed,
      availedDates: availedDateFields,
      orderDocumentLeaveId: getOpt(editEntry.orderDocumentLeaveId) ?? "",
      orderDocumentName: getOpt(editEntry.orderDocumentLeaveId)
        ? "Uploaded Document"
        : "",
      remarks: getOpt(editEntry.remarks) ?? "",
    };
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = useAddLeaveEntry();
  const updateMutation = useUpdateLeaveEntry();

  const isEditing = editEntry !== null;
  const isPending = addMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof LeaveFormState>(
    key: K,
    value: LeaveFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (editEntry) {
      const sanctionedODNum = getOpt(editEntry.sanctionedOD);
      const availedDateFields: DateField[] =
        editEntry.availedDates.length > 0
          ? editEntry.availedDates.map((d) => ({
              id: genId(),
              value: nanoToDateStr(d),
            }))
          : [{ id: genId(), value: "" }];
      setForm({
        leaveType: editEntry.leaveType,
        holidayDutyDate: nanoToDateStr(
          getOpt(editEntry.holidayDutyDate) ?? null,
        ),
        sanctionedDate: nanoToDateStr(getOpt(editEntry.sanctionedDate) ?? null),
        orderNumber: editEntry.orderNumber,
        sanctionedOD: sanctionedODNum !== null ? String(sanctionedODNum) : "1",
        availed: editEntry.availed,
        availedDates: availedDateFields,
        orderDocumentLeaveId: getOpt(editEntry.orderDocumentLeaveId) ?? "",
        orderDocumentName: getOpt(editEntry.orderDocumentLeaveId)
          ? "Uploaded Document"
          : "",
        remarks: getOpt(editEntry.remarks) ?? "",
      });
    } else {
      setForm(makeEmptyForm());
    }
  }, [editEntry]);

  const refDate =
    form.leaveType === "CompOff" ? form.holidayDutyDate : form.sanctionedDate;
  const daysLeft = computeDaysLeft(form.leaveType, refDate);
  const sanctionedODCount = Math.max(
    1,
    Number.parseInt(form.sanctionedOD) || 1,
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const client = await getStorageClient();
      const { hash } = await client.putFile(bytes, (pct) =>
        setUploadProgress(pct),
      );
      set("orderDocumentLeaveId", hash);
      set("orderDocumentName", file.name);
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload document");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addAvailedDate = () => {
    if (form.availedDates.length < sanctionedODCount) {
      set("availedDates", [...form.availedDates, { id: genId(), value: "" }]);
    }
  };

  const removeAvailedDate = (id: string) => {
    const updated = form.availedDates.filter((f) => f.id !== id);
    set(
      "availedDates",
      updated.length > 0 ? updated : [{ id: genId(), value: "" }],
    );
  };

  const updateAvailedDate = (id: string, val: string) => {
    set(
      "availedDates",
      form.availedDates.map((f) => (f.id === id ? { ...f, value: val } : f)),
    );
  };

  const buildInput = (): LeaveEntryInput => {
    const validDates = form.availedDates
      .map((f) => f.value)
      .filter((d) => d.trim() !== "");
    return {
      userId,
      leaveType: form.leaveType,
      holidayDutyDate:
        form.leaveType === "CompOff" && form.holidayDutyDate
          ? someVal(dateToNano(form.holidayDutyDate))
          : noneVal,
      sanctionedDate:
        form.leaveType === "UnpunchedOD" && form.sanctionedDate
          ? someVal(dateToNano(form.sanctionedDate))
          : noneVal,
      sanctionedOD:
        form.leaveType === "UnpunchedOD"
          ? someVal(BigInt(sanctionedODCount))
          : noneVal,
      orderDocumentLeaveId: form.orderDocumentLeaveId
        ? someVal(form.orderDocumentLeaveId)
        : noneVal,
      orderNumber: form.orderNumber,
      availed: form.availed,
      availedDates: form.availed ? validDates.map((d) => dateToNano(d)) : [],
      remarks: form.remarks.trim() ? someVal(form.remarks.trim()) : noneVal,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refD =
      form.leaveType === "CompOff" ? form.holidayDutyDate : form.sanctionedDate;
    if (!refD || !form.orderNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.availed) {
      const refDateObj = new Date(refD);
      const validityMonths = form.leaveType === "CompOff" ? 3 : 12;
      const expiryDate = addMonths(refDateObj, validityMonths);
      for (const f of form.availedDates) {
        if (!f.value) continue;
        const availedD = new Date(f.value);
        if (availedD < refDateObj || availedD > expiryDate) {
          toast.error(
            `Availed date must be within ${validityMonths} month${validityMonths > 1 ? "s" : ""} of the reference date`,
          );
          return;
        }
      }
    }
    const input = buildInput();
    try {
      if (isEditing && editEntry) {
        await updateMutation.mutateAsync({ id: editEntry.id, input });
        toast.success("Leave entry updated successfully");
        onCancelEdit();
        onSuccess?.();
      } else {
        await addMutation.mutateAsync(input);
        toast.success("Leave entry added successfully");
        setForm(makeEmptyForm());
        onSuccess?.();
      }
    } catch (err) {
      toast.error(
        `Failed to ${isEditing ? "update" : "add"} entry: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error(err);
    }
  };

  const daysLeftColor =
    daysLeft === null
      ? ""
      : daysLeft <= 0
        ? "text-destructive"
        : daysLeft < 14
          ? "text-orange-500"
          : daysLeft < 30
            ? "text-yellow-600"
            : "text-success-foreground";

  return (
    <div
      ref={formRef}
      className="bg-card rounded-xl border border-border shadow-card"
    >
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">
          {isEditing ? "Edit Leave Entry" : "Add Leave Entry"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Comp Off &amp; Unpunched OD Tracker
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Leave Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Leave Type *</Label>
          <Select
            value={form.leaveType}
            onValueChange={(v) => {
              set("leaveType", v);
              set("availedDates", [{ id: genId(), value: "" }]);
            }}
          >
            <SelectTrigger data-ocid="leave.select" className="text-sm">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CompOff">Comp Off</SelectItem>
              <SelectItem value="UnpunchedOD">Unpunched OD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Comp Off Fields ── */}
        {form.leaveType === "CompOff" && (
          <div className="space-y-4 border-l-2 border-primary/20 pl-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="holidayDutyDate"
                  className="text-xs font-medium"
                >
                  Holiday Duty Date *
                </Label>
                <Input
                  id="holidayDutyDate"
                  type="date"
                  data-ocid="leave.input"
                  value={form.holidayDutyDate}
                  onChange={(e) => set("holidayDutyDate", e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="orderNumberComp"
                  className="text-xs font-medium"
                >
                  Order Number *
                </Label>
                <Input
                  id="orderNumberComp"
                  type="text"
                  data-ocid="leave.input"
                  value={form.orderNumber}
                  onChange={(e) => set("orderNumber", e.target.value)}
                  placeholder="e.g. ORD/2025/001"
                  required
                  className="text-sm"
                />
              </div>
            </div>

            {form.holidayDutyDate && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xs font-medium text-muted-foreground">
                  Use Before (3 month validity):
                </span>
                <span className={`text-sm font-bold ${daysLeftColor}`}>
                  {daysLeft !== null && daysLeft <= 0
                    ? "Expired"
                    : form.holidayDutyDate
                      ? addMonths(
                          new Date(form.holidayDutyDate),
                          3,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.availed}
                  onCheckedChange={(v) => set("availed", v)}
                  data-ocid="leave.switch"
                />
                <span className="text-sm font-medium">
                  Availed:{" "}
                  <span className="text-muted-foreground">
                    {form.availed ? "Yes" : "No"}
                  </span>
                </span>
              </div>

              {form.availed && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="availedDateComp"
                    className="text-xs font-medium"
                  >
                    Availed Date{" "}
                    <span className="text-muted-foreground font-normal">
                      (must be within 3 months of holiday duty date)
                    </span>
                  </Label>
                  <Input
                    id="availedDateComp"
                    type="date"
                    data-ocid="leave.input"
                    value={form.availedDates[0]?.value ?? ""}
                    onChange={(e) =>
                      updateAvailedDate(
                        form.availedDates[0]?.id ?? "",
                        e.target.value,
                      )
                    }
                    min={form.holidayDutyDate}
                    max={
                      form.holidayDutyDate
                        ? addMonths(new Date(form.holidayDutyDate), 3)
                            .toISOString()
                            .slice(0, 10)
                        : undefined
                    }
                    className="text-sm max-w-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remarksComp" className="text-xs font-medium">
                Remarks (Optional)
              </Label>
              <Textarea
                id="remarksComp"
                data-ocid="leave.textarea"
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="Any additional notes..."
                className="text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* ── Unpunched OD Fields ── */}
        {form.leaveType === "UnpunchedOD" && (
          <div className="space-y-4 border-l-2 border-accent-foreground/20 pl-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sanctionedDate" className="text-xs font-medium">
                  Sanctioned Date *
                </Label>
                <Input
                  id="sanctionedDate"
                  type="date"
                  data-ocid="leave.input"
                  value={form.sanctionedDate}
                  onChange={(e) => set("sanctionedDate", e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orderNumberOD" className="text-xs font-medium">
                  Order Number *
                </Label>
                <Input
                  id="orderNumberOD"
                  type="text"
                  data-ocid="leave.input"
                  value={form.orderNumber}
                  onChange={(e) => set("orderNumber", e.target.value)}
                  placeholder="e.g. ORD/2025/001"
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sanctionedOD" className="text-xs font-medium">
                  Sanctioned OD (count) *
                </Label>
                <Input
                  id="sanctionedOD"
                  type="number"
                  data-ocid="leave.input"
                  value={form.sanctionedOD}
                  onChange={(e) => {
                    set("sanctionedOD", e.target.value);
                    const n = Math.max(1, Number.parseInt(e.target.value) || 1);
                    const trimmed = form.availedDates.slice(0, n);
                    set(
                      "availedDates",
                      trimmed.length > 0
                        ? trimmed
                        : [{ id: genId(), value: "" }],
                    );
                  }}
                  min="1"
                  required
                  className="text-sm"
                />
              </div>
            </div>

            {form.sanctionedDate && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xs font-medium text-muted-foreground">
                  Days Left to Use (12 month validity):
                </span>
                <span className={`text-sm font-bold ${daysLeftColor}`}>
                  {daysLeft !== null && daysLeft <= 0
                    ? "Expired"
                    : daysLeft !== null
                      ? `${daysLeft} days`
                      : "—"}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.availed}
                  onCheckedChange={(v) => set("availed", v)}
                  data-ocid="leave.switch"
                />
                <span className="text-sm font-medium">
                  Availed:{" "}
                  <span className="text-muted-foreground">
                    {form.availed ? "Yes" : "No"}
                  </span>
                </span>
              </div>

              {form.availed && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Availed Date{sanctionedODCount > 1 ? "s" : ""}{" "}
                    <span className="text-muted-foreground font-normal">
                      (within 12 months of sanctioned date
                      {sanctionedODCount > 1
                        ? `, max ${sanctionedODCount}`
                        : ""}
                      )
                    </span>
                  </Label>
                  {form.availedDates.map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        type="date"
                        data-ocid="leave.input"
                        value={field.value}
                        onChange={(e) =>
                          updateAvailedDate(field.id, e.target.value)
                        }
                        min={form.sanctionedDate}
                        max={
                          form.sanctionedDate
                            ? addMonths(new Date(form.sanctionedDate), 12)
                                .toISOString()
                                .slice(0, 10)
                            : undefined
                        }
                        className="text-sm max-w-xs"
                      />
                      {sanctionedODCount > 1 &&
                        form.availedDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAvailedDate(field.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  ))}
                  {sanctionedODCount > 1 &&
                    form.availedDates.length < sanctionedODCount && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-ocid="leave.button"
                        onClick={addAvailedDate}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add another date
                      </Button>
                    )}
                </div>
              )}
            </div>

            {/* Document Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Order Document</Label>
              {form.orderDocumentName ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/50">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">
                    {form.orderDocumentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      set("orderDocumentLeaveId", "");
                      set("orderDocumentName", "");
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="leave.upload_button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Uploading {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" /> Upload Order
                        Document
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remarksOD" className="text-xs font-medium">
                Remarks (Optional)
              </Label>
              <Textarea
                id="remarksOD"
                data-ocid="leave.textarea"
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="Any additional notes..."
                className="text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!actorReady && (
          <p className="text-xs text-muted-foreground">
            Connecting to backend...
          </p>
        )}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button
            type="submit"
            data-ocid="leave.submit_button"
            disabled={isPending || uploading || !actorReady}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : isEditing ? (
              "Update Entry"
            ) : (
              "Add Leave Entry"
            )}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              data-ocid="leave.cancel_button"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
