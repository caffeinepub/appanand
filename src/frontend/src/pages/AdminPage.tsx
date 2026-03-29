import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FileText,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card data-ocid="admin.card" className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-9 w-20" data-ocid="admin.loading_state" />
        ) : (
          <p className="text-4xl font-bold tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminPage() {
  const { adminLogout } = useAuth();
  const { actor, isFetching } = useActor();
  const actorReady = !!actor && !isFetching;

  const { data: userCount } = useQuery<number>({
    queryKey: ["admin", "userCount"],
    queryFn: async () => {
      const count: bigint = await (actor as any).getUserCount();
      return Number(count);
    },
    enabled: actorReady,
  });

  const { data: dutyCount } = useQuery<number>({
    queryKey: ["admin", "dutyCount"],
    queryFn: async () => {
      const entries = await (actor as any).getAllDutyEntries();
      return (entries as any[]).length;
    },
    enabled: actorReady,
  });

  const { data: leaveCount } = useQuery<number>({
    queryKey: ["admin", "leaveCount"],
    queryFn: async () => {
      const entries = await (actor as any).getAllLeaveEntries();
      return (entries as any[]).length;
    },
    enabled: actorReady,
  });

  const { data: upcomingCount } = useQuery<number>({
    queryKey: ["admin", "upcomingCount"],
    queryFn: async () => {
      const entries = await (actor as any).getAllUpcomingDuties();
      return (entries as any[]).length;
    },
    enabled: actorReady,
  });

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
            data-ocid="admin.button"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
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
              System-wide overview of all records
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Registered Users"
            value={userCount}
            icon={<Users className="w-4 h-4 text-blue-600" />}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            label="Other Duty Records"
            value={dutyCount}
            icon={<ClipboardList className="w-4 h-4 text-green-600" />}
            color="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            label="Leave Records"
            value={leaveCount}
            icon={<FileText className="w-4 h-4 text-purple-600" />}
            color="bg-purple-100 dark:bg-purple-900/30"
          />
          <StatCard
            label="Upcoming Duties"
            value={upcomingCount}
            icon={<CalendarClock className="w-4 h-4 text-orange-600" />}
            color="bg-orange-100 dark:bg-orange-900/30"
          />
        </div>

        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Logged in as{" "}
            <span className="font-semibold text-foreground">Myappadmin</span>.
            Admin access is read-only — data is managed by individual users.
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
