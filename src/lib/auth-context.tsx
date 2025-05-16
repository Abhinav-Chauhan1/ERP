"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to sync user with database
  const syncUserWithDatabase = async () => {
    if (!clerkUser) return;

    try {
      const response = await fetch(`/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: clerkUser.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.id,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          role: data.role,
        });
      }
    } catch (error) {
      console.error("Error syncing user with database:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync user when clerk user changes
  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        syncUserWithDatabase();
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [clerkUser, clerkLoaded]);

  return (
    <AuthContext.Provider value={{ user, loading, syncUserWithDatabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}