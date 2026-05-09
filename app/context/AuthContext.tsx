"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  role_name?: string;
  company_name?: string;
  status?: string;
  user_type?: "super_admin" | "admin" | "b2b_client" | "viewer";
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
  logout: () => void;
  getInitials: (name: string) => string;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePasswordState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserState(JSON.parse(stored));
      setMustChangePasswordState(localStorage.getItem("mustChangePassword") === "true");
    } catch {
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUser = (user: AuthUser | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const setMustChangePassword = (value: boolean) => {
    setMustChangePasswordState(value);
    localStorage.setItem("mustChangePassword", String(value));
  };

  const logout = () => {
    setUserState(null);
    setMustChangePasswordState(false);
    localStorage.clear();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, mustChangePassword, setMustChangePassword, logout, getInitials, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
