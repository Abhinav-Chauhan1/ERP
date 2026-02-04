import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@prisma/client"

export const authConfig = {
    session: {
        strategy: "jwt", // Use JWT for Edge Runtime compatibility
        maxAge: 24 * 60 * 60, // 24 hours in seconds (increased from 30 minutes)
    },

    pages: {
        signIn: "/login",
        error: "/login"
    },

    callbacks: {
        async session({ session, token }) {
            // Add role and context data to session from JWT token
            if (session.user && token) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
                session.user.mobile = token.mobile as string
                session.user.schoolId = token.schoolId as string | null
                session.user.schoolName = token.schoolName as string | null
                session.user.schoolCode = token.schoolCode as string | null
                session.user.authorizedSchools = token.authorizedSchools as string[]
                session.user.isSuperAdmin = token.role === "SUPER_ADMIN"
            }
            return session
        },

        async jwt({ token, user, trigger }) {
            // Add user data to token on sign in
            if (user) {
                token.role = user.role
                token.id = user.id
                token.mobile = user.mobile
                token.schoolId = user.schoolId
                token.schoolCode = user.schoolCode
                token.schoolName = user.schoolName
                token.authorizedSchools = user.authorizedSchools
            }

            // Refresh user data from database on update trigger or periodically
            if (trigger === "update" && token.id) {
                const { db } = await import("@/lib/db")
                
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
                  if (dbUser.role === "SUPER_ADMIN") {
                    token.role = "SUPER_ADMIN"
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
