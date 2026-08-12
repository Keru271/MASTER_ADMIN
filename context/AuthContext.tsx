"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    if (storedToken) {
      setToken(storedToken);
      fetchMe(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async (authToken: string) => {
    try {
      const data = await fetchApi<User>("/api/users/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (data.role !== "ADMIN") {
        throw new Error("Access denied. Master Admin privileges required.");
      }

      setUser(data);
    } catch (err) {
      console.error("Failed to load admin user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await fetchApi<{ accessToken: string }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data.accessToken) {
      throw new Error("Login failed. Check credentials.");
    }

    // Verify user role
    const me = await fetchApi<User>("/api/users/me", {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });

    if (me.role !== "ADMIN") {
      throw new Error("Unauthorized! Only Master Admin accounts can access this panel.");
    }

    localStorage.setItem("admin_token", data.accessToken);
    setToken(data.accessToken);
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
