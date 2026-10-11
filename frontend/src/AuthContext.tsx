import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type User } from "./api";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser({
      id: "00000000-0000-0000-0000-000000000000",
      email: "admin@briodelights.com",
      display_name: "Admin",
      bakery_name: "Brio Delights",
    });
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
