import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, LogOut, Shield, Users } from "lucide-react";
import type { DutyEntry, LeaveEntry, UpcomingDuty, User } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

function formatDate(ts: bigint | number | undefined): string {
  if (ts === undefined || ts === null) return "—";
  const ms = typeof ts === "bigint" ? Number(ts) / 1_000_000 : ts;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const SKELETON_ROWS = ["a", "b", "c", "d"];

export function AdminPage() {
  const { adminLogout } = useAuth();
  const { actor, isFetching } = useActor();
  const actorReady = !!actor && !isFetching;

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => (actor as any).getAllUsers(),
    enabled: actorReady,
  });

  const { data: dutyEntries } = useQuery<DutyEntry[]>({
    queryKey: ["admin", "allDutyEntries"],
    queryFn: async () => (actor as any).getAllDutyEntries(),
    enabled: actorReady,
  });

  const { data: leaveEntries } = useQuery<LeaveEntry[]>({
    queryKey: ["admin", "allLeaveEntries"],
    queryFn: async () => (actor as any).getAllLeaveEntries(),
    enabled: actorReady,
  });

  const { data: upcomingEntries } = useQuery<UpcomingDuty[]>({
    queryKey: ["admin", "allUpcomingEntries"],
    queryFn: async () => (actor as any).getAllUpcomingDuties(),
    enabled: actorReady,
  });

  // Compute last entry date per userId across all three entry types
  const lastEntryMap = (() => {
    const map: Record<string, bigint> = {};
    const consider = (userId: bigint, ts: bigint) => {
      const key = userId.toString();
      if (!map[key] || ts > map[key]) map[key] = ts;
    };
    for (const e of dutyEntries ?? []) consider(e.userId, e.createdAt);
    for (const e of leaveEntries ?? []) consider(e.userId, e.createdAt);
    for (const e of upcomingEntries ?? []) consider(e.userId, e.createdAt);
    return map;
  })();

  const dataReady =
    dutyEntries !== undefined &&
    leaveEntries !== undefined &&
    upcomingEntries !== undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-widest text-foreground leading-tight">
                APPANAND
              </h1>
              <p className="text-xs text-muted-foreground">
                Personal Duty &amp; Leave Tracker
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={adminLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        {/* Admin badge + heading */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Read-only view &mdash; registered users and their last activity
            </p>
          </div>
        </div>

        {/* User List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />
              Registered Users
              {users && (
                <Badge variant="secondary" className="ml-1">
                  {users.length} / 100
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading || !dataReady ? (
              <div className="p-6 space-y-3">
                {SKELETON_ROWS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Entry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...users]
                    .sort((a, b) => Number(a.id) - Number(b.id))
                    .map((user, idx) => {
                      const lastTs = lastEntryMap[user.id.toString()];
                      return (
                        <TableRow key={user.id.toString()}>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {lastTs ? (
                              formatDate(lastTs)
                            ) : (
                              <span className="italic text-sm">
                                No entries yet
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No users registered yet.
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Appanand. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
