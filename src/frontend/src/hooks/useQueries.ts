import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DutyEntry,
  DutyEntryInput,
  LeaveEntry,
  LeaveEntryInput,
  UpcomingDuty,
  UpcomingDutyInput,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllDutyEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<DutyEntry[]>({
    queryKey: ["dutyEntries"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      const entries: DutyEntry[] = await a.getAllDutyEntries();
      return [...entries].sort((x, y) => Number(y.createdAt - x.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDutyEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DutyEntryInput) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).addDutyEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dutyEntries"] });
    },
  });
}

export function useUpdateDutyEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: DutyEntryInput }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).updateDutyEntry(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dutyEntries"] });
    },
  });
}

export function useDeleteDutyEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteDutyEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dutyEntries"] });
    },
  });
}

// ─── Leave Entry Hooks ────────────────────────────────────────────────────────

export function useGetAllLeaveEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<LeaveEntry[]>({
    queryKey: ["leaveEntries"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      const entries: LeaveEntry[] = await a.getAllLeaveEntries();
      return [...entries].sort((x, y) => Number(y.createdAt - x.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLeaveEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeaveEntryInput) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).addLeaveEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveEntries"] });
    },
  });
}

export function useUpdateLeaveEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: LeaveEntryInput }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).updateLeaveEntry(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveEntries"] });
    },
  });
}

export function useDeleteLeaveEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteLeaveEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveEntries"] });
    },
  });
}

// ─── Upcoming Duty Hooks ──────────────────────────────────────────────────────

export function useGetAllUpcomingDuties() {
  const { actor, isFetching } = useActor();
  return useQuery<UpcomingDuty[]>({
    queryKey: ["upcomingDuties"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUpcomingDuties();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUpcomingDuty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpcomingDutyInput) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).addUpcomingDuty(input);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["upcomingDuties"] }),
  });
}

export function useUpdateUpcomingDuty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: UpcomingDutyInput }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).updateUpcomingDuty(id, input);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["upcomingDuties"] }),
  });
}

export function useDeleteUpcomingDuty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteUpcomingDuty(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["upcomingDuties"] }),
  });
}

export function useMarkUpcomingDutyCompleted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markUpcomingDutyCompleted(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcomingDuties"] });
      queryClient.invalidateQueries({ queryKey: ["dutyEntries"] });
    },
  });
}

export function useMarkUpcomingDutyMissed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markUpcomingDutyMissed(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["upcomingDuties"] }),
  });
}

// ─── Per-User Query Hooks ─────────────────────────────────────────────────────

export function useGetDutyEntriesByUser(userId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<DutyEntry[]>({
    queryKey: ["dutyEntries", userId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const entries: DutyEntry[] = await (actor as any).getDutyEntriesByUser(
        userId,
      );
      return [...entries].sort((x, y) => Number(y.createdAt - x.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLeaveEntriesByUser(userId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<LeaveEntry[]>({
    queryKey: ["leaveEntries", userId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const entries: LeaveEntry[] = await (actor as any).getLeaveEntriesByUser(
        userId,
      );
      return [...entries].sort((x, y) => Number(y.createdAt - x.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUpcomingDutiesByUser(userId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<UpcomingDuty[]>({
    queryKey: ["upcomingDuties", userId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getUpcomingDutiesByUser(userId);
    },
    enabled: !!actor && !isFetching,
  });
}
