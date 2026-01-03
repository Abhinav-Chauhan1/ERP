/**
 * NextAuth v5 API Route Handler
 * 
 * This route handles all NextAuth authentication endpoints:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out
 * - /api/auth/callback/* - OAuth callbacks
 * - /api/auth/session - Get session
 * - /api/auth/csrf - CSRF token
 * - /api/auth/providers - List providers
 * 
 * The handlers are exported from the central auth.ts configuration.
 * 
 * @see src/auth.ts for NextAuth configuration
 * @see Requirements 1.10
 */
import { handlers } from "@/auth"

export const { GET, POST } = handlers
