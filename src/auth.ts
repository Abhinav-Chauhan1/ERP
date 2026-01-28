import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { verifyPassword } from "@/lib/password"
import { authenticationService } from "@/lib/services/authentication-service"
import { schoolContextService } from "@/lib/services/school-context-service"
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
        mobile: { label: "Mobile", type: "text", optional: true },
        schoolCode: { label: "School Code", type: "text", optional: true },
        totpCode: { label: "2FA Code", type: "text", optional: true }
      },
      async authorize(credentials) {
        console.log("DEBUG: NextAuth authorize called with keys:", Object.keys(credentials || {}))
        
        const identifier = (credentials?.email || credentials?.mobile) as string
        const password = credentials?.password as string
        const schoolCode = credentials?.schoolCode as string
        const totpCode = credentials?.totpCode as string

        if (!identifier || !password) {
          // Log failed login - missing credentials
          if (identifier) {
            try {
              await logAuditEvent({
                userId: null,
                action: 'FAILED',
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  reason: 'MISSING_CREDENTIALS',
                  timestamp: new Date()
                }
              })
            } catch (e) {
              console.error("Failed to log audit event:", e)
            }
          }
          return null
        }

        try {
          // If school code is provided, validate it first
          let schoolId: string | undefined
          if (schoolCode) {
            const school = await schoolContextService.validateSchoolCode(schoolCode)
            if (!school) {
              await logAuditEvent({
                userId: null,
                action: 'FAILED',
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  schoolCode,
                  reason: 'INVALID_SCHOOL_CODE',
                  timestamp: new Date()
                }
              })
              return null
            }
            schoolId = school.id
          }

          // Find user by identifier (email or mobile)
          const user = await db.user.findFirst({
            where: {
              OR: [
                { email: identifier },
                { mobile: identifier }
              ],
              isActive: true
            },
            include: {
              userSchools: {
                where: {
                  isActive: true,
                  ...(schoolId && { schoolId })
                },
                include: { school: true }
              }
            }
          })

          if (!user || !user.passwordHash) {
            await logAuditEvent({
              userId: null,
              action: 'FAILED',
              resource: 'nextauth_login',
              changes: {
                identifier,
                schoolCode,
                reason: 'USER_NOT_FOUND_OR_NO_PASSWORD',
                timestamp: new Date()
              }
            })
            return null
          }

          // If school context is provided, validate user has access to that school
          if (schoolId && user.userSchools.length === 0) {
            await logAuditEvent({
              userId: user.id,
              schoolId,
              action: 'FAILED',
              resource: 'nextauth_login',
              changes: {
                identifier,
                schoolCode,
                reason: 'USER_NOT_IN_SCHOOL',
                timestamp: new Date()
              }
            })
            return null
          }

          // Verify password using the existing password verification
          const isValidPassword = await verifyPassword(password, user.passwordHash)

          if (!isValidPassword) {
            await logAuditEvent({
              userId: user.id,
              schoolId,
              action: 'FAILED',
              resource: 'nextauth_login',
              changes: {
                identifier,
                schoolCode,
                reason: 'INVALID_PASSWORD',
                timestamp: new Date()
              }
            })
            return null
          }

          // Check if email is verified (if user has email)
          if (user.email && !user.emailVerified) {
            await logAuditEvent({
              userId: user.id,
              schoolId,
              action: 'FAILED',
              resource: 'nextauth_login',
              changes: {
                identifier,
                reason: 'EMAIL_NOT_VERIFIED',
                timestamp: new Date()
              }
            })
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled) {
            if (!totpCode || totpCode === "undefined") {
              await logAuditEvent({
                userId: user.id,
                schoolId,
                action: 'FAILED',
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  reason: '2FA_REQUIRED',
                  timestamp: new Date()
                }
              })
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
                    totpCode,
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
                    const remainingCount = backupResult.remainingCodes
                      ? JSON.parse(await decrypt(backupResult.remainingCodes)).length
                      : 0
                    
                    await logAuditEvent({
                      userId: user.id,
                      action: 'UPDATE',
                      resource: '2fa_backup_code',
                      changes: {
                        remainingCodes: remainingCount,
                        timestamp: new Date()
                      }
                    })
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
              await logAuditEvent({
                userId: user.id,
                schoolId,
                action: 'FAILED',
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  reason: 'INVALID_2FA_CODE',
                  timestamp: new Date()
                }
              })
              throw new Error("INVALID_2FA_CODE")
            }
          }

          // Log successful authentication
          await logAuditEvent({
            userId: user.id,
            schoolId,
            action: 'SUCCESS',
            resource: 'nextauth_login',
            changes: {
              identifier,
              schoolCode,
              authMethod: 'password',
              has2FA: user.twoFactorEnabled,
              timestamp: new Date()
            }
          })

          // Return user object with unified authentication data
          return {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            role: user.userSchools[0]?.role || UserRole.STUDENT,
            image: user.image || user.avatar,
            schoolId: user.userSchools[0]?.schoolId,
            schoolCode: user.userSchools[0]?.school?.schoolCode,
            schoolName: user.userSchools[0]?.school?.name,
            authorizedSchools: user.userSchools.map(us => us.schoolId)
          }

        } catch (error) {
          console.error("NextAuth authorization error:", error)
          
          if (error instanceof Error && ['EMAIL_NOT_VERIFIED', '2FA_REQUIRED', 'INVALID_2FA_CODE'].includes(error.message)) {
            throw error
          }

          await logAuditEvent({
            userId: null,
            action: 'ERROR',
            resource: 'nextauth_login',
            changes: {
              identifier,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            }
          })

          return null
        }
      }
    })
  ],

  callbacks: {
    ...authConfig.callbacks,
    async signIn() {
      // Credentials provider handles all validation in authorize()
      return true
    },

    async jwt({ token, user, trigger }) {
      // Add unified authentication data to token on sign in
      if (user) {
        token.role = user.role
        token.id = user.id
        token.mobile = user.mobile
        token.schoolId = user.schoolId
        token.schoolCode = user.schoolCode
        token.schoolName = user.schoolName
        token.authorizedSchools = user.authorizedSchools
      }

      // Refresh user data from database on update trigger or if we want to ensure latest data
      if ((trigger === "update" || user) && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            mobile: true,
            name: true,
            image: true,
            avatar: true,
            isActive: true
          },
          include: {
            userSchools: {
              where: { isActive: true },
              include: {
                school: {
                  select: {
                    id: true,
                    name: true,
                    schoolCode: true,
                    status: true
                  }
                }
              }
            }
          }
        })

        if (dbUser && dbUser.isActive) {
          token.email = dbUser.email
          token.mobile = dbUser.mobile
          token.name = dbUser.name
          token.picture = dbUser.image || dbUser.avatar

          // Update school context and role based on current user-school relationships
          const activeUserSchools = dbUser.userSchools.filter(us => 
            us.school.status === 'ACTIVE'
          )

          if (activeUserSchools.length > 0) {
            // Use the first active school as default context
            const primaryUserSchool = activeUserSchools[0]
            token.role = primaryUserSchool.role
            token.schoolId = primaryUserSchool.school.id
            token.schoolName = primaryUserSchool.school.name
            token.schoolCode = primaryUserSchool.school.schoolCode
            token.authorizedSchools = activeUserSchools.map(us => us.schoolId)
          } else {
            // No active schools - clear school context
            token.role = null
            token.schoolId = null
            token.schoolName = null
            token.schoolCode = null
            token.authorizedSchools = []
          }
        } else {
          // User is inactive or doesn't exist - clear token data
          token.role = null
          token.schoolId = null
          token.schoolName = null
          token.schoolCode = null
          token.authorizedSchools = []
        }
      }

      return token
    },

    async session({ session, token }) {
      // Add unified authentication data to session
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.mobile = token.mobile as string
        session.user.schoolId = token.schoolId as string
        session.user.schoolCode = token.schoolCode as string
        session.user.schoolName = token.schoolName as string
        session.user.authorizedSchools = token.authorizedSchools as string[]
      }
      return session
    }
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in event using unified audit system
      if (user.id) {
        await logAuditEvent({
          userId: user.id,
          schoolId: user.schoolId,
          action: 'SUCCESS',
          resource: 'nextauth_signin',
          changes: {
            provider: account?.provider || "credentials",
            isNewUser,
            authMethod: 'nextauth',
            schoolCode: user.schoolCode,
            timestamp: new Date()
          }
        })
      }
    },

    async signOut(params) {
      // Log sign-out event using unified audit system
      const token = 'token' in params ? params.token : null
      if (token?.id) {
        await logAuditEvent({
          userId: token.id as string,
          schoolId: token.schoolId as string,
          action: 'SUCCESS',
          resource: 'nextauth_signout',
          changes: {
            authMethod: 'nextauth',
            schoolCode: token.schoolCode,
            timestamp: new Date()
          }
        })
      }
    }
  }
})
