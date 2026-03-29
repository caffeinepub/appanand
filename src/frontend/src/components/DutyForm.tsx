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
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DutyEntry, DutyEntryInput, Option } from "../backend.d";
import { useAddDutyEntry, useUpdateDutyEntry } from "../hooks/useQueries";
import { getStorageClient } from "../utils/storageUtils";

const WORK_TYPES = [
  "OMR Exam",
  "OMR Dept Exam",
  "OLE",
  "Dept OLE",
  "Interview",
  "PET/Practical/Endurance",
  "Others",
];

const DUTY_ROLES = [
  "ACS",
  "Invigilator",
  "Biometric Verifier",
  "TSS",
  "Others",
];

const TA_SUBMISSION_STATUSES = ["Not Submitted", "Submitted"];

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
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

interface FormState {
  dutyDate: string;
  reportingTime: string;
  workType: string;
  dutyRole: string;
  orderNo: string;
  remunerationAmount: string;
  remunerationCredited: boolean;
  remunerationCreditDate: string;
  taEligible: boolean;
  taAmount: string;
  taSubmissionStatus: string;
  taCredited: boolean;
  taCreditDate: string;
  orderDocumentId: string;
  orderDocumentName: string;
  remarks: string;
}

const emptyForm: FormState = {
  dutyDate: "",
  reportingTime: "",
  workType: "",
  dutyRole: "",
  orderNo: "",
  remunerationAmount: "",
  remunerationCredited: false,
  remunerationCreditDate: "",
  taEligible: false,
  taAmount: "",
  taSubmissionStatus: "Not Submitted",
  taCredited: false,
  taCreditDate: "",
  orderDocumentId: "",
  orderDocumentName: "",
  remarks: "",
};

interface DutyFormProps {
  userId: bigint;
  editEntry: DutyEntry | null;
  onCancelEdit: () => void;
  formRef: React.RefObject<HTMLDivElement | null>;
}

export function DutyForm({
  editEntry,
  onCancelEdit,
  formRef,
  userId,
}: DutyFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = useAddDutyEntry();
  const updateMutation = useUpdateDutyEntry();

  const isEditing = editEntry !== null;
  const isPending = addMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editEntry) {
      setForm({
        dutyDate: nanoToDateStr(editEntry.dutyDate),
        reportingTime: getOpt(editEntry.reportingTime) ?? "",
        workType: editEntry.workType,
        dutyRole: editEntry.dutyRole,
        orderNo: editEntry.orderNo,
        remunerationAmount: String(editEntry.remunerationAmount),
        remunerationCredited: editEntry.remunerationCredited,
        remunerationCreditDate: nanoToDateStr(
          getOpt(editEntry.remunerationCreditDate) ?? null,
        ),
        taEligible: editEntry.taEligible,
        taAmount: String(getOpt(editEntry.taAmount) ?? ""),
        taSubmissionStatus:
          getOpt(editEntry.taSubmissionStatus) ?? "Not Submitted",
        taCredited: getOpt(editEntry.taCredited) ?? false,
        taCreditDate: nanoToDateStr(getOpt(editEntry.taCreditDate) ?? null),
        orderDocumentId: getOpt(editEntry.orderDocumentId) ?? "",
        orderDocumentName: getOpt(editEntry.orderDocumentId)
          ? "Uploaded Document"
          : "",
        remarks: getOpt(editEntry.remarks) ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editEntry]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      set("orderDocumentId", hash);
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

  const buildInput = (): DutyEntryInput => ({
    userId,
    dutyDate: dateToNano(form.dutyDate),
    reportingTime: form.reportingTime ? someVal(form.reportingTime) : noneVal,
    workType: form.workType,
    dutyRole: form.dutyRole,
    orderNo: form.orderNo,
    remunerationAmount: Number(form.remunerationAmount) || 0,
    remunerationCredited: form.remunerationCredited,
    remunerationCreditDate:
      form.remunerationCredited && form.remunerationCreditDate
        ? someVal(dateToNano(form.remunerationCreditDate))
        : noneVal,
    taEligible: form.taEligible,
    taAmount:
      form.taEligible && form.taAmount
        ? someVal(Number(form.taAmount))
        : noneVal,
    taSubmissionStatus: form.taEligible
      ? someVal(form.taSubmissionStatus)
      : noneVal,
    taCredited: form.taEligible ? someVal(form.taCredited) : noneVal,
    taCreditDate:
      form.taEligible && form.taCredited && form.taCreditDate
        ? someVal(dateToNano(form.taCreditDate))
        : noneVal,
    orderDocumentId: form.orderDocumentId
      ? someVal(form.orderDocumentId)
      : noneVal,
    remarks: form.remarks.trim() ? someVal(form.remarks.trim()) : noneVal,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dutyDate || !form.workType || !form.dutyRole) {
      toast.error("Please fill in Duty Date, Work Type, and Duty Role");
      return;
    }
    const input = buildInput();
    try {
      if (isEditing && editEntry) {
        await updateMutation.mutateAsync({ id: editEntry.id, input });
        toast.success("Duty entry updated successfully");
        onCancelEdit();
      } else {
        await addMutation.mutateAsync(input);
        toast.success("Duty entry added successfully");
        setForm(emptyForm);
      }
    } catch (err) {
      toast.error(isEditing ? "Failed to update entry" : "Failed to add entry");
      console.error(err);
    }
  };

  return (
    <div
      ref={formRef}
      className="bg-card rounded-xl border border-border shadow-card"
    >
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">
          {isEditing ? "Edit Duty Entry" : "Add New Duty"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Daily Duty Log</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Basic Info */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Basic Info
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dutyDate" className="text-xs font-medium">
              Duty Date *
            </Label>
            <Input
              id="dutyDate"
              type="date"
              data-ocid="duty.input"
              value={form.dutyDate}
              onChange={(e) => set("dutyDate", e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reportingTime" className="text-xs font-medium">
              Reporting Time
            </Label>
            <Input
              id="reportingTime"
              type="time"
              data-ocid="duty.input"
              value={form.reportingTime}
              onChange={(e) => set("reportingTime", e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workType" className="text-xs font-medium">
              Work Type *
            </Label>
            <Select
              value={form.workType}
              onValueChange={(v) => set("workType", v)}
            >
              <SelectTrigger data-ocid="duty.select" className="text-sm">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dutyRole" className="text-xs font-medium">
              Duty Role *
            </Label>
            <Select
              value={form.dutyRole}
              onValueChange={(v) => set("dutyRole", v)}
            >
              <SelectTrigger data-ocid="duty.select" className="text-sm">
                <SelectValue placeholder="Select duty role" />
              </SelectTrigger>
              <SelectContent>
                {DUTY_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orderNo" className="text-xs font-medium">
              Order No
            </Label>
            <Input
              id="orderNo"
              data-ocid="duty.input"
              value={form.orderNo}
              onChange={(e) => set("orderNo", e.target.value)}
              placeholder="e.g. ORD/2025/001"
              className="text-sm"
            />
          </div>
        </div>

        {/* Remuneration */}
        <div className="border-t border-border pt-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Remuneration
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="remunerationAmount"
                className="text-xs font-medium"
              >
                Remuneration Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  id="remunerationAmount"
                  type="number"
                  data-ocid="duty.input"
                  value={form.remunerationAmount}
                  onChange={(e) => set("remunerationAmount", e.target.value)}
                  placeholder="0"
                  className="pl-7 text-sm"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Remuneration Credited?
              </Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={form.remunerationCredited}
                  onCheckedChange={(v) => set("remunerationCredited", v)}
                  data-ocid="duty.switch"
                />
                <span className="text-sm text-muted-foreground">
                  {form.remunerationCredited ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {form.remunerationCredited && (
            <div className="space-y-1.5">
              <Label
                htmlFor="remunerationCreditDate"
                className="text-xs font-medium"
              >
                Credit Date
              </Label>
              <Input
                id="remunerationCreditDate"
                type="date"
                data-ocid="duty.input"
                value={form.remunerationCreditDate}
                onChange={(e) => set("remunerationCreditDate", e.target.value)}
                className="text-sm max-w-xs"
              />
            </div>
          )}
        </div>

        {/* TA */}
        <div className="border-t border-border pt-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Travel Allowance (TA)
          </p>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.taEligible}
              onCheckedChange={(v) => set("taEligible", v)}
              data-ocid="duty.switch"
            />
            <span className="text-sm font-medium">
              TA Eligible:{" "}
              <span className="text-muted-foreground">
                {form.taEligible ? "Yes" : "No"}
              </span>
            </span>
          </div>

          {form.taEligible && (
            <div className="space-y-4 pl-2 border-l-2 border-primary/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taAmount" className="text-xs font-medium">
                    TA Amount (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
                    </span>
                    <Input
                      id="taAmount"
                      type="number"
                      data-ocid="duty.input"
                      value={form.taAmount}
                      onChange={(e) => set("taAmount", e.target.value)}
                      placeholder="0"
                      className="pl-7 text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="taSubmissionStatus"
                    className="text-xs font-medium"
                  >
                    TA Submission Status
                  </Label>
                  <Select
                    value={form.taSubmissionStatus}
                    onValueChange={(v) => set("taSubmissionStatus", v)}
                  >
                    <SelectTrigger data-ocid="duty.select" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TA_SUBMISSION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.taCredited}
                  onCheckedChange={(v) => set("taCredited", v)}
                  data-ocid="duty.switch"
                />
                <span className="text-sm font-medium">
                  TA Credited:{" "}
                  <span className="text-muted-foreground">
                    {form.taCredited ? "Yes" : "No"}
                  </span>
                </span>
              </div>

              {form.taCredited && (
                <div className="space-y-1.5">
                  <Label htmlFor="taCreditDate" className="text-xs font-medium">
                    TA Credit Date
                  </Label>
                  <Input
                    id="taCreditDate"
                    type="date"
                    data-ocid="duty.input"
                    value={form.taCreditDate}
                    onChange={(e) => set("taCreditDate", e.target.value)}
                    className="text-sm max-w-xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document & Notes */}
        <div className="border-t border-border pt-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Document &amp; Notes
          </p>

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
                    set("orderDocumentId", "");
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
                  data-ocid="duty.upload_button"
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
                      <Upload className="w-4 h-4 mr-2" /> Upload Document
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks" className="text-xs font-medium">
              Remarks (Optional)
            </Label>
            <Textarea
              id="remarks"
              data-ocid="duty.textarea"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Any additional notes..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            data-ocid="duty.submit_button"
            disabled={isPending || uploading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : isEditing ? (
              "Update Entry"
            ) : (
              "Add Duty Entry"
            )}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              data-ocid="duty.cancel_button"
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
