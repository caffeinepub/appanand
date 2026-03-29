import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import type { DutyEntry, LeaveEntry, UpcomingDuty } from "./backend.d";
import { DutyForm } from "./components/DutyForm";
import { DutyTable } from "./components/DutyTable";
import { Header } from "./components/Header";
import { HeroBand } from "./components/HeroBand";
import { LeaveForm } from "./components/LeaveForm";
import { LeaveStats } from "./components/LeaveStats";
import { LeaveTable } from "./components/LeaveTable";
import { StatsOverview } from "./components/StatsOverview";
import { UpcomingDutyForm } from "./components/UpcomingDutyForm";
import { UpcomingDutyTable } from "./components/UpcomingDutyTable";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  useGetDutyEntriesByUser,
  useGetLeaveEntriesByUser,
  useGetUpcomingDutiesByUser,
} from "./hooks/useQueries";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function MainApp() {
  const { currentUser } = useAuth();
  const userId = currentUser!.id;

  const { data: dutyEntries = [], isLoading: dutyLoading } =
    useGetDutyEntriesByUser(userId);
  const { data: leaveEntries = [], isLoading: leaveLoading } =
    useGetLeaveEntriesByUser(userId);
  const { data: upcomingDuties = [], isLoading: upcomingLoading } =
    useGetUpcomingDutiesByUser(userId);

  const [editDuty, setEditDuty] = useState<DutyEntry | null>(null);
  const [editLeave, setEditLeave] = useState<LeaveEntry | null>(null);
  const [editUpcoming, setEditUpcoming] = useState<UpcomingDuty | null>(null);
  const dutyFormRef = useRef<HTMLDivElement>(null);
  const leaveFormRef = useRef<HTMLDivElement>(null);
  const upcomingFormRef = useRef<HTMLDivElement>(null);

  const handleEditDuty = (entry: DutyEntry) => {
    setEditDuty(entry);
    setTimeout(
      () =>
        dutyFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const handleEditLeave = (entry: LeaveEntry) => {
    setEditLeave(entry);
    setTimeout(
      () =>
        leaveFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const handleEditUpcoming = (entry: UpcomingDuty) => {
    setEditUpcoming(entry);
    setTimeout(
      () =>
        upcomingFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const handleLogNew = () => {
    setEditDuty(null);
    setTimeout(
      () =>
        dutyFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <HeroBand />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="duties" data-ocid="app.tab">
          <TabsList className="mb-4" data-ocid="app.tab">
            <TabsTrigger
              value="duties"
              data-ocid="app.tab"
              className="font-medium"
            >
              📋 Other Duties
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              data-ocid="app.tab"
              className="font-medium"
            >
              🏖️ Comp Off &amp; Unpunched OD
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              data-ocid="app.tab"
              className="font-medium"
            >
              📅 Upcoming Duties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="duties" className="space-y-6">
            <StatsOverview entries={dutyEntries} onLogNew={handleLogNew} />
            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
              <DutyForm
                editEntry={editDuty}
                onCancelEdit={() => setEditDuty(null)}
                formRef={dutyFormRef}
                userId={userId}
              />
              <DutyTable
                entries={dutyEntries}
                isLoading={dutyLoading}
                onEdit={handleEditDuty}
              />
            </div>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <LeaveStats entries={leaveEntries} />
            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
              <LeaveForm
                editEntry={editLeave}
                onCancelEdit={() => setEditLeave(null)}
                formRef={leaveFormRef}
                userId={userId}
              />
              <LeaveTable
                entries={leaveEntries}
                isLoading={leaveLoading}
                onEdit={handleEditLeave}
              />
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
              <UpcomingDutyForm
                editEntry={editUpcoming}
                onCancelEdit={() => setEditUpcoming(null)}
                formRef={upcomingFormRef}
                userId={userId}
              />
              <UpcomingDutyTable
                entries={upcomingDuties}
                isLoading={upcomingLoading}
                onEdit={handleEditUpcoming}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Appanand &mdash; Personal Duty
            Tracker. Built with ❤️ using{" "}
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

function AuthGate() {
  const { currentUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (!currentUser) {
    if (showRegister) {
      return <RegisterPage onGoLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onGoRegister={() => setShowRegister(true)} />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
