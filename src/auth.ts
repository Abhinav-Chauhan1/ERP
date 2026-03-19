import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { UserRole, AuditAction } from "@prisma/client"
import { verifyPassword } from "@/lib/password"
import { logAuditEvent } from "@/lib/services/audit-service"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mobile: { label: "Mobile", type: "text" },
        schoolCode: { label: "School Code", type: "text" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        // Treat the string literal "undefined" (sent by some form fields) as absent
        const email =
          credentials?.email && credentials.email !== "undefined"
            ? (credentials.email as string)
            : undefined
        const mobile =
          credentials?.mobile && credentials.mobile !== "undefined"
            ? (credentials.mobile as string)
            : undefined

        const identifier = email || mobile
        const password = credentials?.password as string | undefined
        const schoolCode = credentials?.schoolCode as string | undefined
        const totpCode = credentials?.totpCode as string | undefined

        if (!identifier) {
          throw new Error("Phone number or email is required")
        }

        if (!password) {
          throw new Error("Password is required")
        }

        try {
          // ── 1. Validate school (for non-super-admin users) ──────────────────
          // We validate school status here so suspended schools block ALL roles.
          let schoolFilter = {}
          if (schoolCode) {
            const school = await db.school.findUnique({
              where: { schoolCode: schoolCode.toUpperCase().trim() },
              select: { id: true, status: true },
            })

            if (!school) {
              await logAuditEvent({
                userId: null,
                action: AuditAction.LOGIN,
                resource: "nextauth_login",
                changes: { identifier, schoolCode, reason: "SCHOOL_NOT_FOUND", timestamp: new Date() },
              })
              return null
            }

            if (school.status !== "ACTIVE") {
              await logAuditEvent({
                userId: null,
                action: AuditAction.LOGIN,
                resource: "nextauth_login",
                changes: { identifier, schoolCode, reason: "SCHOOL_INACTIVE", timestamp: new Date() },
              })
              throw new Error("SCHOOL_INACTIVE")
            }

            schoolFilter = { schoolCode: schoolCode.toUpperCase().trim() }
          }

          // ── 2. Look up user ──────────────────────────────────────────────────
          const user = await db.user.findFirst({
            where: {
              OR: [{ email: identifier }, { mobile: identifier }],
              isActive: true,
            },
            include: {
              userSchools: {
                where: {
                  isActive: true,
                  ...(schoolCode ? { school: schoolFilter } : {}),
                },
                include: { school: true },
              },
            },
          })

          if (!user) {
            await logAuditEvent({
              userId: null,
              action: AuditAction.LOGIN,
              resource: "nextauth_login",
              changes: { identifier, schoolCode, reason: "USER_NOT_FOUND", timestamp: new Date() },
            })
            return null
          }

          // ── 3. School association check (skip for SUPER_ADMIN) ───────────────
          if (user.role !== UserRole.SUPER_ADMIN && user.userSchools.length === 0) {
            await logAuditEvent({
              userId: user.id,
              action: AuditAction.LOGIN,
              resource: "nextauth_login",
              changes: { identifier, schoolCode, reason: "NO_SCHOOL_ASSOCIATION", timestamp: new Date() },
            })
            return null
          }

          // ── 4. Validate that the user's school(s) are ACTIVE ────────────────
          // (Covers the case where schoolCode wasn't provided but user has schools)
          if (user.role !== UserRole.SUPER_ADMIN) {
            const hasActiveSchool = user.userSchools.some(
              (us) => us.school.status === "ACTIVE"
            )
            if (!hasActiveSchool) {
              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
                resource: "nextauth_login",
                changes: { identifier, schoolCode, reason: "SCHOOL_INACTIVE", timestamp: new Date() },
              })
              throw new Error("SCHOOL_INACTIVE")
            }
          }

          // ── 5. Password verification (all roles) ─────────────────────────────
          if (!user.passwordHash) {
            await logAuditEvent({
              userId: user.id,
              action: AuditAction.LOGIN,
              resource: "nextauth_login",
              changes: { identifier, schoolCode, reason: "NO_PASSWORD_SET", timestamp: new Date() },
            })
            return null
          }

          const isValidPassword = await verifyPassword(password, user.passwordHash)
          if (!isValidPassword) {
            await logAuditEvent({
              userId: user.id,
              action: AuditAction.LOGIN,
              resource: "nextauth_login",
              changes: { identifier, schoolCode, reason: "INVALID_PASSWORD", timestamp: new Date() },
            })
            return null
          }

          // ── 6. Email verification (skip for SUPER_ADMIN) ─────────────────────
          if (user.email && !user.emailVerified && user.role !== UserRole.SUPER_ADMIN) {
            await logAuditEvent({
              userId: user.id,
              action: AuditAction.LOGIN,
              resource: "nextauth_login",
              changes: { identifier, reason: "EMAIL_NOT_VERIFIED", timestamp: new Date() },
            })
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          // ── 7. 2FA check ─────────────────────────────────────────────────────
          if (user.twoFactorEnabled) {
            if (!totpCode) {
              throw new Error("2FA_REQUIRED")
            }

            let isValid2FA = false
            try {
              const { verifyBackupCode, decrypt, verifyTOTPToken } = await import(
                "@/lib/utils/two-factor"
              )

              if (user.twoFactorSecret) {
                try {
                  const secret = await decrypt(user.twoFactorSecret)
                  isValid2FA = verifyTOTPToken(totpCode, secret)
                } catch {
                  // fall through to backup code check
                }
              }

              if (!isValid2FA && user.twoFactorBackupCodes) {
                try {
                  const backupResult = await verifyBackupCode(totpCode, user.twoFactorBackupCodes)
                  if (backupResult.valid) {
                    isValid2FA = true
                    await db.user.update({
                      where: { id: user.id },
                      data: { twoFactorBackupCodes: backupResult.remainingCodes },
                    })
                    const remainingCount = backupResult.remainingCodes
                      ? JSON.parse(await decrypt(backupResult.remainingCodes)).length
                      : 0
                    await logAuditEvent({
                      userId: user.id,
                      action: AuditAction.UPDATE,
                      resource: "2fa_backup_code",
                      changes: { remainingCodes: remainingCount, timestamp: new Date() },
                    })
                  }
                } catch (err) {
                  console.error("Error verifying backup code:", err)
                }
              }
            } catch (err) {
              console.error("Error loading 2FA utils:", err)
            }

            if (!isValid2FA) {
              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
                resource: "nextauth_login",
                changes: { identifier, reason: "INVALID_2FA_CODE", timestamp: new Date() },
              })
              throw new Error("INVALID_2FA_CODE")
            }
          }

          // ── 8. Success ────────────────────────────────────────────────────────
          await logAuditEvent({
            userId: user.id,
            schoolId: user.userSchools[0]?.schoolId || undefined,
            action: AuditAction.LOGIN,
            resource: "nextauth_login",
            changes: {
              identifier,
              schoolCode,
              authMethod: "password",
              has2FA: user.twoFactorEnabled,
              timestamp: new Date(),
            },
          })

          // Filter to only active schools for the token
          const activeUserSchools = user.userSchools.filter(
            (us) => us.school.status === "ACTIVE"
          )

          return {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            role:
              user.role === UserRole.SUPER_ADMIN
                ? UserRole.SUPER_ADMIN
                : (activeUserSchools[0]?.role || UserRole.STUDENT),
            image: user.avatar || undefined,
            schoolId: activeUserSchools[0]?.schoolId || undefined,
            schoolCode: activeUserSchools[0]?.school?.schoolCode || undefined,
            schoolName: activeUserSchools[0]?.school?.name || undefined,
            authorizedSchools: activeUserSchools.map((us) => us.schoolId),
          }
        } catch (error) {
          console.error("NextAuth authorization error:", error)

          if (
            error instanceof Error &&
            ["EMAIL_NOT_VERIFIED", "2FA_REQUIRED", "INVALID_2FA_CODE", "SCHOOL_INACTIVE"].includes(
              error.message
            )
          ) {
            throw error
          }

          await logAuditEvent({
            userId: null,
            action: AuditAction.LOGIN,
            resource: "nextauth_login",
            changes: {
              identifier,
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date(),
            },
          })

          return null
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async signIn() {
      return true
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.id = user.id as string
        token.mobile = user.mobile
        token.schoolId = user.schoolId
        token.schoolCode = user.schoolCode
        token.schoolName = user.schoolName
        token.authorizedSchools = user.authorizedSchools
      }

      if ((trigger === "update" || user) && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: {
            userSchools: {
              where: { isActive: true },
              include: { school: true },
            },
          },
        })

        if (dbUser && dbUser.isActive) {
          token.email = dbUser.email
          token.mobile = dbUser.mobile ?? undefined
          token.name = dbUser.name
          token.picture = dbUser.avatar ?? undefined

          if (dbUser.role === UserRole.SUPER_ADMIN) {
            token.role = UserRole.SUPER_ADMIN
            token.schoolId = null
            token.schoolName = null
            token.schoolCode = null
            // Empty array signals "super admin — check isSuperAdmin flag for all-access"
            token.authorizedSchools = []
          } else {
            const activeUserSchools = dbUser.userSchools.filter(
              (us) => us.school.status === "ACTIVE"
            )

            if (activeUserSchools.length > 0) {
              const primary = activeUserSchools[0]
              token.role = primary.role
              token.schoolId = primary.school.id
              token.schoolName = primary.school.name
              token.schoolCode = primary.school.schoolCode
              token.authorizedSchools = activeUserSchools.map((us) => us.schoolId)
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              token.role = null as any
              token.schoolId = null
              token.schoolName = null
              token.schoolCode = null
              token.authorizedSchools = []
            }
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.role = null as any
          token.schoolId = null
          token.schoolName = null
          token.schoolCode = null
          token.authorizedSchools = []
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = (token.role ?? UserRole.STUDENT) as UserRole
        session.user.mobile = (token.mobile as string | null) ?? null
        session.user.schoolId = (token.schoolId as string | null) ?? null
        session.user.schoolCode = (token.schoolCode as string | null) ?? null
        session.user.schoolName = (token.schoolName as string | null) ?? null
        session.user.authorizedSchools = (token.authorizedSchools as string[]) ?? []
        session.user.isSuperAdmin = token.role === UserRole.SUPER_ADMIN
      }
      return session
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (user.id) {
        await logAuditEvent({
          userId: user.id,
          schoolId: user.schoolId || undefined,
          action: AuditAction.LOGIN,
          resource: "nextauth_signin",
          changes: {
            provider: account?.provider || "credentials",
            isNewUser,
            authMethod: "nextauth",
            schoolCode: user.schoolCode || undefined,
            timestamp: new Date(),
          },
        })
      }
    },

    async signOut(params) {
      const token = "token" in params ? params.token : null
      if (token?.id) {
        await logAuditEvent({
          userId: token.id as string,
          schoolId: (token.schoolId as string) || undefined,
          action: AuditAction.LOGOUT,
          resource: "nextauth_signout",
          changes: {
            authMethod: "nextauth",
            schoolCode: (token.schoolCode as string) || undefined,
            timestamp: new Date(),
          },
        })
      }
    },
  },
})
