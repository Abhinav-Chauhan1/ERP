import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { verifyPassword } from "@/lib/password"
import { TOTP } from "otpauth"

// Extend NextAuth types to include role
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt", // Use JWT for Edge Runtime compatibility
    maxAge: 1800, // 30 minutes in seconds
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text", optional: true }
      },
      async authorize(credentials) {
        console.log("DEBUG: Authorize called with keys:", Object.keys(credentials || {}))
        const email = credentials?.email as string

        if (!credentials?.email || !credentials?.password) {
          // Log failed login - missing credentials
          if (email) {
            try {
              const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
              await logLoginFailure(email, "INVALID_CREDENTIALS", { reason: "Missing credentials" })
            } catch (e) {
              console.error("Failed to log audit event:", e)
            }
          }
          return null
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email }
        })

        if (!user || !user.password) {
          // Log failed login - user not found or no password
          try {
            const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
            await logLoginFailure(email, "INVALID_CREDENTIALS", { reason: "User not found or no password" })
          } catch (e) { console.error("Failed to log audit event:", e) }
          return null
        }

        // Verify password (supports both bcrypt and Web Crypto PBKDF2 hashes)
        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          // Log failed login - invalid password
          try {
            const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
            await logLoginFailure(email, "INVALID_CREDENTIALS", { reason: "Invalid password" })
          } catch (e) { console.error("Failed to log audit event:", e) }
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Log failed login - email not verified
          try {
            const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
            await logLoginFailure(email, "EMAIL_NOT_VERIFIED", { userId: user.id })
          } catch (e) { console.error("Failed to log audit event:", e) }
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        // Check if account is active
        if (!user.active) {
          // Log failed login - account inactive
          try {
            const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
            await logLoginFailure(email, "ACCOUNT_INACTIVE", { userId: user.id })
          } catch (e) {
            // Silently ignore audit log errors to prevent login failure
          }
          throw new Error("ACCOUNT_INACTIVE")
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled) {
          const totpCode = credentials.totpCode as string;
          if (!totpCode || totpCode === "undefined") {
            // Log failed login - 2FA required but not provided
            try {
              const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
              await logLoginFailure(email, "2FA_REQUIRED", { userId: user.id })
            } catch (e) {
              // Silently ignore audit log errors to prevent login failure
            }
            throw new Error("2FA_REQUIRED")
          }

          let isValid2FA = false

          try {
            // Import 2FA utilities
            const { verifyBackupCode, decrypt, verifyTOTPToken } = await import("@/lib/utils/two-factor")

            // First, try TOTP code verification
            if (user.twoFactorSecret) {
              try {
                const secret = await decrypt(user.twoFactorSecret)
                const isValidTotp = verifyTOTPToken(totpCode, secret)

                if (isValidTotp) {
                  isValid2FA = true
                }
              } catch (error) {
                // Silently ignore 2FA errors to allow backup code check
              }
            }

            // If TOTP fails, try backup codes
            if (!isValid2FA && user.twoFactorBackupCodes) {
              try {
                const backupResult = await verifyBackupCode(
                  credentials.totpCode as string,
                  user.twoFactorBackupCodes
                )

                if (backupResult.valid) {
                  isValid2FA = true

                  // Update user with remaining backup codes
                  await db.user.update({
                    where: { id: user.id },
                    data: {
                      twoFactorBackupCodes: backupResult.remainingCodes
                    }
                  })

                  // Log backup code usage
                  const { log2FABackupCodeUsed } = await import("@/lib/services/auth-audit-service")
                  const remainingCount = backupResult.remainingCodes
                    ? JSON.parse(await decrypt(backupResult.remainingCodes)).length
                    : 0
                  await log2FABackupCodeUsed(user.id, remainingCount)
                }
              } catch (error) {
                console.error("Error verifying backup code:", error)
              }
            }
          } catch (error) {
            console.error("Error loading 2FA utils:", error)
          }



          // If both TOTP and backup code fail, throw error
          if (!isValid2FA) {
            // Log failed login - invalid 2FA code
            const { logLoginFailure } = await import("@/lib/services/auth-audit-service")
            await logLoginFailure(email, "INVALID_2FA_CODE", { userId: user.id })
            throw new Error("INVALID_2FA_CODE")
          }
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.image || user.avatar
        }
      }
    })
  ],

  callbacks: {
    async signIn() {
      // Credentials provider handles all validation in authorize()
      return true
    },

    async session({ session, token }) {
      // Add role and id to session from JWT token
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },

    async jwt({ token, user, trigger }) {
      // Add role and id to token on sign in
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      // Refresh user data from database on update trigger
      if (trigger === "update" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, email: true, name: true, image: true, avatar: true }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.image || dbUser.avatar
        }
      }

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

  pages: {
    signIn: "/login",
    error: "/login"
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in event
      if (user.id) {
        await db.auditLog.create({
          data: {
            action: "UPDATE",
            resource: "AUTH",
            userId: user.id,
            changes: {
              event: "USER_LOGIN",
              provider: account?.provider || "credentials",
              isNewUser
            }
          }
        })
      }
    },

    async signOut(params) {
      // Log sign-out event
      const token = 'token' in params ? params.token : null
      if (token?.id) {
        await db.auditLog.create({
          data: {
            action: "UPDATE",
            resource: "AUTH",
            userId: token.id as string,
            changes: {
              event: "USER_LOGOUT"
            }
          }
        })
      }
    }
  }
})
