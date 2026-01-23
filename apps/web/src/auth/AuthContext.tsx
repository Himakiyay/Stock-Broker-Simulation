import React, { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  token: string | null;
  isAuthed: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "access_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading] = useState(false);

  const setToken = (next: string | null) => {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
    setTokenState(next);
  };

  const logout = () => setToken(null);

  const value = useMemo(
    () => ({
      token,
      isAuthed: !!token,
      isLoading,
      setToken,
      logout,
    }),
    [token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
