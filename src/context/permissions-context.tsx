"use client";

import { createContext, useContext, ReactNode } from "react";

interface PermissionsContextType {
    permissions: string[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children, permissions }: { children: ReactNode; permissions: string[] }) {
    return (
        <PermissionsContext.Provider value={{ permissions }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function useUserPermissions() {
    const context = useContext(PermissionsContext);
    // If used outside provider, return empty array rather than crashing, 
    // or return null/undefined to let component decide. 
    // But crashing alerts developer to wrap key layouts.
    // For now, let's return [] permissions if context is missing, so it defaults to "no access" safe mode.
    if (context === undefined) {
        console.warn("useUserPermissions used outside PermissionsProvider");
        return [];
    }
    return context.permissions;
}
