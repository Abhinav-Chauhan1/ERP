import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@prisma/client"

export const authConfig = {
    session: {
        strategy: "jwt", // Use JWT for Edge Runtime compatibility
        maxAge: 1800, // 30 minutes in seconds
    },

    pages: {
        signIn: "/login",
        error: "/login"
    },

    callbacks: {
        async session({ session, token }) {
            // Add role and id to session from JWT token
            if (session.user && token) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
                session.user.schoolId = token.schoolId as string | null
                session.user.schoolName = token.schoolName as string | null
                session.user.schoolCode = token.schoolCode as string | null
                session.user.isSuperAdmin = token.role === "SUPER_ADMIN"
            }
            return session
        },

        async jwt({ token, user, trigger }) {
            // Add role and id to token on sign in - this part doesn't need DB
            if (user) {
                token.role = user.role
                token.id = user.id
            }

            // We keep the heavy DB refresh logic in auth.ts

            return token
        },

        async redirect({ url, baseUrl }) {
            // Handle redirects after sign in
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`
            } else if (new URL(url).origin === baseUrl) {
                return url
            }
            return baseUrl
        }
    },

    providers: [], // Providers (like Credentials) will be added in auth.ts
} satisfies NextAuthConfig
