export function HeroBand() {
  return (
    <section
      className="py-8 px-4 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.94 0.02 245) 0%, oklch(0.965 0.009 245) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Welcome back, <span className="text-primary">Rajesh Kumar!</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Other Duties Tracker &mdash; Log and manage your non-office work
          assignments
        </p>
      </div>
    </section>
  );
}
