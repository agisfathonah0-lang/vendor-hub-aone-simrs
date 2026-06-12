import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/utils";

interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  institutionId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem("vps_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch("/api/vendor/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("vps_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/api/vendor/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("vps_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("vps_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
