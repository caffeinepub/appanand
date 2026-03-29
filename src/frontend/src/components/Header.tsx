import { Button } from "@/components/ui/button";
import { CheckSquare, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-widest text-foreground">
              APPANAND
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {["Dashboard", "Other Duties", "Reports"].map((item, i) => (
              <span
                key={item}
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  i === 0
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </span>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground">
                    Welcome, {currentUser.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Personal Tracker
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  data-ocid="header.button"
                  className="gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
