import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckSquare, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

interface RegisterPageProps {
  onGoLogin: () => void;
}

export function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const { register, isLoading } = useAuth();
  const { actor, isFetching } = useActor();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    (actor as any).getUserCount().then((c: bigint) => setUserCount(Number(c)));
  }, [actor, isFetching]);

  const registrationClosed = userCount !== null && userCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    const result = await register(name.trim(), username.trim(), password);
    if (!result.success) {
      toast.error(result.error ?? "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <CheckSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-foreground">
            APPANAND
          </h1>
          <p className="text-sm text-muted-foreground">
            Personal Duty &amp; Leave Tracker
          </p>
        </div>

        <Card data-ocid="register.card">
          <CardHeader>
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              Register to start tracking your duties and leaves
              {userCount !== null && !registrationClosed && (
                <span className="ml-1 text-muted-foreground">
                  ({userCount}/10 users)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrationClosed ? (
              <Alert variant="destructive" data-ocid="register.error_state">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Registration is closed. Maximum 10 users have been registered.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    data-ocid="register.input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    data-ocid="register.input"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    data-ocid="register.input"
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-ocid="register.submit_button"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={onGoLogin}
                data-ocid="register.link"
              >
                Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} Appanand. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
