import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    // Required when running behind a reverse proxy / CDN (Vercel, Cloudflare, etc.)
    // Without this, NextAuth rejects the forwarded host header and can't read the session cookie.
    trustHost: true,
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    callbacks: {
        // jwt and session callbacks are intentionally absent here.
        // auth.ts defines the authoritative versions and they override any
        // callback defined in this config via the ...authConfig.callbacks spread.
        // Keeping them here would cause a redundant DB hit on every session update.

        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`
            if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    },

    providers: [], // Credentials provider is added in auth.ts
} satisfies NextAuthConfig
