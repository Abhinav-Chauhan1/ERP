"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define user type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Create an auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Attempt to fetch the current user from your API
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // For now, we'll use a dummy admin user
  useEffect(() => {
    // This is just for development - remove in production
    if (!user) {
      setUser({
        id: "admin-user-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN"
      });
      setLoading(false);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Implement your login logic here
      // For now, we'll just simulate a successful login
      setUser({
        id: "admin-user-id",
        name: "Admin User",
        email: email,
        role: "ADMIN"
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Implement your logout logic here
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}