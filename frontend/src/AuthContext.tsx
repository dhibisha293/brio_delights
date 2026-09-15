import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin, logout as apiLogout, me, signup as apiSignup, type User } from "./api";

const TOKEN_KEY = "brio_token";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    display_name: string;
    bakery_name: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const result = await apiLogin({ email, password });
        localStorage.setItem(TOKEN_KEY, result.access_token);
        setUser(result.user);
      },
      async signup(input) {
        const result = await apiSignup(input);
        localStorage.setItem(TOKEN_KEY, result.access_token);
        setUser(result.user);
      },
      async logout() {
        try {
          await apiLogout();
        } catch {
          /* still clear local session */
        }
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      },
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
