import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const setAuth = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("auth_token", t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  }, []);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    const baseUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Invalid token"))))
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [token, logout]);

  const setUserFromProfile = useCallback((u: User) => {
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, setAuth, setUser: setUserFromProfile, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
