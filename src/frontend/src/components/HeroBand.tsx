import { useAuth } from "../context/AuthContext";

export function HeroBand() {
  const { currentUser } = useAuth();
  return (
    <section
      className="py-8 px-4 sm:px-6 lg:px-10"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.94 0.02 245) 0%, oklch(0.965 0.009 245) 100%)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Welcome, <span className="text-primary">{currentUser?.name}!</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Other Duties Tracker &mdash; Log and manage your non-office work
          assignments
        </p>
      </div>
    </section>
  );
}
