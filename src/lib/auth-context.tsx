"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

// Define user type
type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

// Create an auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  syncUserWithDatabase: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  syncUserWithDatabase: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to sync user with database (now mostly handled by NextAuth)
  const syncUserWithDatabase = async () => {
    if (!session?.user) return;

    try {
      // With NextAuth, session already contains user data from database
      // This function is kept for compatibility but may not be needed
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email,
        role: session.user.role,
      });
    } catch (error) {
      console.error("Error syncing user with database:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync user when session changes
  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email,
        role: session.user.role,
      });
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session, status]);

  return (
    <AuthContext.Provider value={{ user, loading, syncUserWithDatabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}