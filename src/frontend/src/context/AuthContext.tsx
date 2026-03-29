import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STORAGE_KEY = "appanand_user";

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
        // bigint fields are stored as strings
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
  const [isLoading, setIsLoading] = useState(false);

  // wait for actor before enabling
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
      // Auto-login
      const loginResult = await login(username, password);
      return loginResult;
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout, register }}
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
