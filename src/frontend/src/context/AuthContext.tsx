import type React from "react";
import { createContext, useContext, useState } from "react";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STORAGE_KEY = "appanand_user";
const ADMIN_KEY = "appanand_admin";
const ADMIN_USERNAME = "Myappadmin";
const ADMIN_PASSWORD = "Myapp@admin";

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  adminLogout: () => void;
  register: (
    name: string,
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          id: BigInt(parsed.id),
          createdAt: BigInt(parsed.createdAt),
        };
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => localStorage.getItem(ADMIN_KEY) === "true",
  );
  const [isLoading, setIsLoading] = useState(false);

  const actorReady = !!actor && !isFetching;

  const persistUser = (user: User) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...user,
        id: user.id.toString(),
        createdAt: user.createdAt.toString(),
      }),
    );
    setCurrentUser(user);
  };

  const login = async (username: string, password: string) => {
    // Admin shortcut — no backend call needed
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, "true");
      setIsAdmin(true);
      return { success: true };
    }

    if (!actorReady) return { success: false, error: "App not ready yet" };
    setIsLoading(true);
    try {
      const result = await (actor as any).loginUser(username, password);
      if (result.__kind__ === "Some") {
        persistUser(result.value);
        return { success: true };
      }
      return { success: false, error: "Invalid username or password" };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
  };

  const register = async (name: string, username: string, password: string) => {
    if (!actorReady) return { success: false, error: "App not ready yet" };
    setIsLoading(true);
    try {
      const count: bigint = await (actor as any).getUserCount();
      if (count >= BigInt(10)) {
        return {
          success: false,
          error: "Registration is closed. Maximum 10 users reached.",
        };
      }
      const result = await (actor as any).registerUser(
        name,
        username,
        password,
      );
      if (result.__kind__ === "None") {
        return { success: false, error: "Username already taken" };
      }
      persistUser(result.value);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAdmin,
        login,
        logout,
        adminLogout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
