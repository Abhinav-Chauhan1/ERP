import { UserRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

// Extend NextAuth types to include role and school context
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string | null
            image: string | null
            role: UserRole
            schoolId?: string | null
            schoolName?: string | null
            schoolCode?: string | null
            isSuperAdmin?: boolean
            activeStudentId?: string | null
            authorizedSchools?: string[]
            availableChildren?: Array<{
                id: string
                name: string
                class?: string
                section?: string
            }>
            permissions?: string[]
            isOnboarded?: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        schoolId?: string | null
        schoolName?: string | null
        schoolCode?: string | null
        authorizedSchools?: string[]
    }
}

declare module "@auth/core/adapters" {
    interface AdapterUser {
        role: UserRole
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        schoolId?: string | null
        schoolName?: string | null
        schoolCode?: string | null
        authorizedSchools?: string[]
    }
}
