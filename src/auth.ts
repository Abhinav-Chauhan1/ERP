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
        mobile: { label: "Mobile", type: "text", optional: true },
        schoolCode: { label: "School Code", type: "text", optional: true },
        totpCode: { label: "2FA Code", type: "text", optional: true },
        otpCode: { label: "OTP Code", type: "text", optional: true }
      },
      async authorize(credentials) {
        console.log("DEBUG: NextAuth authorize called with keys:", Object.keys(credentials || {}))

        const identifier = (credentials?.email || credentials?.mobile) as string
        const password = credentials?.password as string
        const schoolCode = credentials?.schoolCode as string
        const totpCode = credentials?.totpCode as string
        const otpCode = credentials?.otpCode as string

        if (!identifier) {
          console.log("Login failed: Missing identifier");
          throw new Error("Phone number or email is required")
        }

        try {
          // Check active connection
          const currentIdentifier = identifier
          const foundUser = await db.user.findFirst({
            where: {
              OR: [
                { email: currentIdentifier },
                { mobile: currentIdentifier }
              ]
            }
          })

          if (!foundUser) {
            return null
          }

          // Find user by identifier (email or mobile)
          // The previous user lookup was just to check existence for error message.
          // Now we fetch with full details and active status.
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
                  ...(schoolCode && {
                    school: {
                      schoolCode: schoolCode
                    }
                  })
                },
                include: {
                  school: true
                }
              }
            }
          })

          if (!user) {
            await logAuditEvent({
              userId: undefined,
              action: AuditAction.LOGIN,
              resource: 'nextauth_login',
              changes: {
                identifier,
                schoolCode,
                reason: 'USER_NOT_FOUND',
                timestamp: new Date()
              }
            })
            return null
          }

          // For OTP-based authentication (students, parents)
          // Ensure otpCode is a valid non-empty string and not "undefined"
          if (otpCode && typeof otpCode === 'string' && otpCode !== 'undefined' && otpCode.trim() !== '') {
            // Verify OTP code - find by identifier, then verify hash
            const bcrypt = await import('bcryptjs')
            const otpRecord = await db.oTP.findFirst({
              where: {
                identifier: identifier,
                expiresAt: { gt: new Date() },
                isUsed: false
              },
              orderBy: { createdAt: 'desc' } // Get the most recent OTP
            })

            if (!otpRecord) {
              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  schoolCode,
                  reason: 'OTP_NOT_FOUND',
                  timestamp: new Date()
                }
              })
              return null
            }

            // Verify the OTP code against the stored hash
            const isValidOtp = await bcrypt.compare(otpCode, otpRecord.codeHash)
            if (!isValidOtp) {
              // Increment attempts
              await db.oTP.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } }
              })

              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  schoolCode,
                  reason: 'INVALID_OTP',
                  timestamp: new Date()
                }
              })
              return null
            }

            // Mark OTP as used
            await db.oTP.update({
              where: { id: otpRecord.id },
              data: { isUsed: true }
            })
          }
          // For password-based authentication (teachers, admins, super-admins)
          else if (password) {
            if (!user.passwordHash) {
              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  schoolCode,
                  reason: 'NO_PASSWORD_SET',
                  timestamp: new Date()
                }
              })
              return null
            }

            const isValidPassword = await verifyPassword(password, user.passwordHash)

            if (!isValidPassword) {
              await logAuditEvent({
                userId: user.id,
                action: AuditAction.LOGIN,
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
          } else {
            // No valid authentication method provided
            return null
          }

          // Check if email is verified (if user has email) - Skip for SUPER_ADMIN
          if (user.email && !user.emailVerified && user.role !== 'SUPER_ADMIN') {
            await logAuditEvent({
              userId: user.id,
              action: AuditAction.LOGIN,
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
          if (user.twoFactorEnabled && totpCode) {
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
                      action: AuditAction.UPDATE,
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
                action: AuditAction.LOGIN,
                resource: 'nextauth_login',
                changes: {
                  identifier,
                  reason: 'INVALID_2FA_CODE',
                  timestamp: new Date()
                }
              })
              throw new Error("INVALID_2FA_CODE")
            }
          } else if (user.twoFactorEnabled && !totpCode) {
            // 2FA is enabled but no code provided
            throw new Error("2FA_REQUIRED")
          }

          // Log successful authentication
          await logAuditEvent({
            userId: user.id,
            schoolId: user.userSchools[0]?.schoolId || undefined,
            action: AuditAction.LOGIN,
            resource: 'nextauth_login',
            changes: {
              identifier,
              schoolCode,
              authMethod: otpCode ? 'otp' : 'password',
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
            // For super-admin users, use their actual role from User table
            // For regular users, use role from UserSchool relationship
            role: user.role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : (user.userSchools[0]?.role || UserRole.STUDENT),
            image: user.image || user.avatar,
            schoolId: user.userSchools[0]?.schoolId || undefined,
            schoolCode: user.userSchools[0]?.school?.schoolCode || undefined,
            schoolName: user.userSchools[0]?.school?.name || undefined,
            authorizedSchools: user.userSchools.map(us => us.schoolId)
          }

        } catch (error) {
          console.error("NextAuth authorization error:", error)

          if (error instanceof Error && ['EMAIL_NOT_VERIFIED', '2FA_REQUIRED', 'INVALID_2FA_CODE'].includes(error.message)) {
            throw error
          }

          await logAuditEvent({
            userId: undefined,
            action: AuditAction.LOGIN,
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
          include: {
            userSchools: {
              where: { isActive: true },
              include: {
                school: true
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
          // For super-admin users, preserve their role and skip school context
          if (dbUser.role === UserRole.SUPER_ADMIN) {
            token.role = UserRole.SUPER_ADMIN
            token.schoolId = null // Super-admin has system-wide access
            token.schoolName = null
            token.schoolCode = null
            token.authorizedSchools = [] // Super-admin can access all schools
          } else {
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
          schoolId: user.schoolId || undefined,
          action: AuditAction.LOGIN,
          resource: 'nextauth_signin',
          changes: {
            provider: account?.provider || "credentials",
            isNewUser,
            authMethod: 'nextauth',
            schoolCode: user.schoolCode || undefined,
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
          schoolId: (token.schoolId as string) || undefined,
          action: AuditAction.LOGOUT,
          resource: 'nextauth_signout',
          changes: {
            authMethod: 'nextauth',
            schoolCode: (token.schoolCode as string) || undefined,
            timestamp: new Date()
          }
        })
      }
    }
  }
})
