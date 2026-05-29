import type { NextAuthConfig } from "next-auth"
import { UserRole } from "@prisma/client"

export const authConfig = {
    // Required when running behind a reverse proxy / CDN (Vercel, Cloudflare, etc.)
    // Without this, NextAuth rejects the forwarded host header and can't read the session cookie.
    trustHost: true,
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 5 * 60, // Re-validate session (incl. school status) every 5 minutes
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    callbacks: {
        // This session callback runs in the middleware (via NextAuth(authConfig)).
        // It must map token fields to session.user so that req.auth.user.id and
        // req.auth.user.role are available for route protection checks.
        // The full version in auth.ts spreads these callbacks and overrides this one
        // for actual page/API requests — so there is no double DB hit.
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = (token.role ?? UserRole.STUDENT) as UserRole
                session.user.schoolId = (token.schoolId as string | null) ?? null
                session.user.schoolCode = (token.schoolCode as string | null) ?? null
                session.user.isSuperAdmin = token.role === UserRole.SUPER_ADMIN
                session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false
            }
            return session
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`
            if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    },

    providers: [], // Credentials provider is added in auth.ts
} satisfies NextAuthConfig
