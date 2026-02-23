import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

interface User {
  id: string;
  email: string;
  displayName: string | null;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const setAuth = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    AsyncStorage.setItem(TOKEN_KEY, t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((t) => {
      setToken(t);
      if (!t) {
        setReady(true);
        return;
      }
      const baseUrl = process.env.API_URL || "";
      fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Invalid token"))))
        .then((data) => setUser(data.user))
        .catch(() => logout())
        .finally(() => setReady(true));
    });
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
