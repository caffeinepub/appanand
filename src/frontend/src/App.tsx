import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useActor } from "./hooks/useActor";
import {
  useGetDutyEntriesByUser,
  useGetLeaveEntriesByUser,
  useGetUpcomingDutiesByUser,
} from "./hooks/useQueries";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function MainApp() {
  const { currentUser } = useAuth();
  const userId = currentUser!.id;
  const { actor, isFetching: actorFetching } = useActor();
  const actorReady = !!actor && !actorFetching;

  const { data: dutyEntries = [], isLoading: dutyLoading } =
    useGetDutyEntriesByUser(userId);
  const { data: leaveEntries = [], isLoading: leaveLoading } =
    useGetLeaveEntriesByUser(userId);
  const { data: upcomingDuties = [], isLoading: upcomingLoading } =
    useGetUpcomingDutiesByUser(userId);

  const [editDuty, setEditDuty] = useState<DutyEntry | null>(null);
  const [editLeave, setEditLeave] = useState<LeaveEntry | null>(null);
  const [editUpcoming, setEditUpcoming] = useState<UpcomingDuty | null>(null);

  const [dutyModalOpen, setDutyModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);

  const dummyRef = useRef<HTMLDivElement>(null);

  const handleEditDuty = (entry: DutyEntry) => {
    setEditDuty(entry);
    setDutyModalOpen(true);
  };

  const handleEditLeave = (entry: LeaveEntry) => {
    setEditLeave(entry);
    setLeaveModalOpen(true);
  };

  const handleEditUpcoming = (entry: UpcomingDuty) => {
    setEditUpcoming(entry);
    setUpcomingModalOpen(true);
  };

  const handleLogNew = () => {
    setEditDuty(null);
    setDutyModalOpen(true);
  };

  const closeDutyModal = () => {
    setDutyModalOpen(false);
    setEditDuty(null);
  };

  const closeLeaveModal = () => {
    setLeaveModalOpen(false);
    setEditLeave(null);
  };

  const closeUpcomingModal = () => {
    setUpcomingModalOpen(false);
    setEditUpcoming(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <HeroBand />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        <Tabs defaultValue="upcoming" data-ocid="app.tab">
          <TabsList
            className="mb-6 h-auto p-1 gap-1 flex flex-wrap"
            data-ocid="app.tab"
          >
            <TabsTrigger
              value="upcoming"
              data-ocid="app.tab"
              className="text-base font-bold px-5 py-2.5 data-[state=active]:shadow-sm"
            >
              📅 Upcoming Duties
            </TabsTrigger>
            <TabsTrigger
              value="duties"
              data-ocid="app.tab"
              className="text-base font-bold px-5 py-2.5 data-[state=active]:shadow-sm"
            >
              📋 Other Duties
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              data-ocid="app.tab"
              className="text-base font-bold px-5 py-2.5 data-[state=active]:shadow-sm"
            >
              🏖️ Comp Off &amp; Unpunched OD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <UpcomingDutyTable
              entries={upcomingDuties}
              isLoading={upcomingLoading}
              onEdit={handleEditUpcoming}
              onAddNew={() => {
                setEditUpcoming(null);
                setUpcomingModalOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="duties" className="space-y-6">
            <StatsOverview entries={dutyEntries} onLogNew={handleLogNew} />
            <DutyTable
              entries={dutyEntries}
              isLoading={dutyLoading}
              onEdit={handleEditDuty}
            />
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <LeaveStats entries={leaveEntries} />
            <LeaveTable
              entries={leaveEntries}
              isLoading={leaveLoading}
              onEdit={handleEditLeave}
              onAddNew={() => {
                setEditLeave(null);
                setLeaveModalOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Duty Form Modal */}
      <Dialog
        open={dutyModalOpen}
        onOpenChange={(open) => !open && closeDutyModal()}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="duty.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editDuty ? "Edit Duty Entry" : "Log New Duty"}
            </DialogTitle>
          </DialogHeader>
          <DutyForm
            key={editDuty ? String(editDuty.id) : "new"}
            editEntry={editDuty}
            onCancelEdit={closeDutyModal}
            formRef={dummyRef}
            userId={userId}
            actorReady={actorReady}
            onSuccess={closeDutyModal}
          />
        </DialogContent>
      </Dialog>

      {/* Leave Form Modal */}
      <Dialog
        open={leaveModalOpen}
        onOpenChange={(open) => !open && closeLeaveModal()}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="leave.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editLeave ? "Edit Leave Entry" : "Add Leave Entry"}
            </DialogTitle>
          </DialogHeader>
          <LeaveForm
            key={editLeave ? String(editLeave.id) : "new"}
            editEntry={editLeave}
            onCancelEdit={closeLeaveModal}
            formRef={dummyRef}
            userId={userId}
            actorReady={actorReady}
            onSuccess={closeLeaveModal}
          />
        </DialogContent>
      </Dialog>

      {/* Upcoming Duty Form Modal */}
      <Dialog
        open={upcomingModalOpen}
        onOpenChange={(open) => !open && closeUpcomingModal()}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="upcoming.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editUpcoming ? "Edit Upcoming Duty" : "Schedule Upcoming Duty"}
            </DialogTitle>
          </DialogHeader>
          <UpcomingDutyForm
            key={editUpcoming ? String(editUpcoming.id) : "new"}
            editEntry={editUpcoming}
            onCancelEdit={closeUpcomingModal}
            formRef={dummyRef}
            userId={userId}
            actorReady={actorReady}
            onSuccess={closeUpcomingModal}
          />
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border mt-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-4">
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
  const { currentUser, isAdmin } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isAdmin) {
    return <AdminPage />;
  }

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
