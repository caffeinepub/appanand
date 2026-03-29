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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UpcomingDuty, UpcomingDutyInput } from "../backend.d";
import { useAddUpcomingDuty, useUpdateUpcomingDuty } from "../hooks/useQueries";

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

const STATUSES = ["Scheduled", "Completed", "Missed"];

function dateToNano(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

function nanoToDateStr(nano: bigint): string {
  const ms = Number(nano) / 1_000_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function scheduleNotification(title: string, body: string, targetTime: Date) {
  const delay = targetTime.getTime() - Date.now();
  if (delay <= 0) return;
  if (delay > 2147483647) return;
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }, delay);
}

interface FormState {
  dutyDate: string;
  reportingTime: string;
  workType: string;
  dutyRole: string;
  orderNumber: string;
  reminderEnabled: boolean;
  status: string;
}

const emptyForm: FormState = {
  dutyDate: "",
  reportingTime: "",
  workType: "",
  dutyRole: "",
  orderNumber: "",
  reminderEnabled: false,
  status: "Scheduled",
};

interface UpcomingDutyFormProps {
  editEntry: UpcomingDuty | null;
  onCancelEdit: () => void;
  formRef: React.RefObject<HTMLDivElement | null>;
  userId: bigint;
}

export function UpcomingDutyForm({
  editEntry,
  onCancelEdit,
  formRef,
  userId,
}: UpcomingDutyFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  const addMutation = useAddUpcomingDuty();
  const updateMutation = useUpdateUpcomingDuty();

  const isEditing = editEntry !== null;
  const isPending = addMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editEntry) {
      setForm({
        dutyDate: nanoToDateStr(editEntry.dutyDate),
        reportingTime: editEntry.reportingTime,
        workType: editEntry.workType,
        dutyRole: editEntry.dutyRole,
        orderNumber: editEntry.orderNumber,
        reminderEnabled: editEntry.reminderEnabled,
        status: editEntry.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editEntry]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const scheduleReminders = async (
    dutyDate: string,
    reportingTime: string,
    workType: string,
    dutyRole: string,
  ) => {
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }

    // Midnight notification
    const midnightDate = new Date(`${dutyDate}T00:01:00`);
    scheduleNotification(
      "Duty Reminder",
      `Duty today: ${workType} at ${reportingTime}`,
      midnightDate,
    );

    // Reporting time notification
    if (reportingTime) {
      const reportDate = new Date(`${dutyDate}T${reportingTime}`);
      scheduleNotification(
        "Time to Report",
        `Time to report for: ${workType} (${dutyRole})`,
        reportDate,
      );
    }
  };

  const buildInput = (): UpcomingDutyInput => ({
    userId,
    dutyDate: dateToNano(form.dutyDate),
    reportingTime: form.reportingTime,
    workType: form.workType,
    dutyRole: form.dutyRole,
    orderNumber: form.orderNumber,
    reminderEnabled: form.reminderEnabled,
    status: form.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.dutyDate ||
      !form.reportingTime ||
      !form.workType ||
      !form.dutyRole
    ) {
      toast.error(
        "Please fill in Duty Date, Reporting Time, Work Type, and Duty Role",
      );
      return;
    }
    const input = buildInput();
    try {
      if (isEditing && editEntry) {
        await updateMutation.mutateAsync({ id: editEntry.id, input });
        toast.success("Upcoming duty updated successfully");
        onCancelEdit();
      } else {
        await addMutation.mutateAsync(input);
        toast.success("Upcoming duty added successfully");
        setForm(emptyForm);
      }

      // Schedule reminders if enabled and date is in the future
      if (
        form.reminderEnabled &&
        new Date(form.dutyDate) >=
          new Date(new Date().toISOString().slice(0, 10))
      ) {
        await scheduleReminders(
          form.dutyDate,
          form.reportingTime,
          form.workType,
          form.dutyRole,
        );
      }
    } catch (err) {
      toast.error(isEditing ? "Failed to update duty" : "Failed to add duty");
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
          {isEditing ? "Edit Upcoming Duty" : "Schedule Upcoming Duty"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Plan ahead</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ud-dutyDate" className="text-xs font-medium">
              Duty Date *
            </Label>
            <Input
              id="ud-dutyDate"
              type="date"
              data-ocid="upcoming.input"
              value={form.dutyDate}
              onChange={(e) => set("dutyDate", e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ud-reportingTime" className="text-xs font-medium">
              Reporting Time *
            </Label>
            <Input
              id="ud-reportingTime"
              type="time"
              data-ocid="upcoming.input"
              value={form.reportingTime}
              onChange={(e) => set("reportingTime", e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ud-workType" className="text-xs font-medium">
              Work Type *
            </Label>
            <Select
              value={form.workType}
              onValueChange={(v) => set("workType", v)}
            >
              <SelectTrigger data-ocid="upcoming.select" className="text-sm">
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
            <Label htmlFor="ud-dutyRole" className="text-xs font-medium">
              Duty Role *
            </Label>
            <Select
              value={form.dutyRole}
              onValueChange={(v) => set("dutyRole", v)}
            >
              <SelectTrigger data-ocid="upcoming.select" className="text-sm">
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
            <Label htmlFor="ud-orderNumber" className="text-xs font-medium">
              Order Number
            </Label>
            <Input
              id="ud-orderNumber"
              data-ocid="upcoming.input"
              value={form.orderNumber}
              onChange={(e) => set("orderNumber", e.target.value)}
              placeholder="e.g. ORD/2025/001"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ud-status" className="text-xs font-medium">
              Status
            </Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger data-ocid="upcoming.select" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Switch
            checked={form.reminderEnabled}
            onCheckedChange={(v) => set("reminderEnabled", v)}
            data-ocid="upcoming.switch"
          />
          <div>
            <p className="text-sm font-medium">Enable Reminder</p>
            <p className="text-xs text-muted-foreground">
              Get browser notifications on duty date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            data-ocid="upcoming.submit_button"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                {isEditing ? "Updating..." : "Scheduling..."}
              </>
            ) : isEditing ? (
              "Update Duty"
            ) : (
              "Schedule Duty"
            )}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              data-ocid="upcoming.cancel_button"
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
