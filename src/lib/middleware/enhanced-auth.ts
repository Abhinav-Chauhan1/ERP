import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { UserRole } from "@prisma/client"

export interface AuthenticatedUser {
  id: string
  email?: string | null
  mobile?: string | null
  name?: string | null
  role: UserRole
  schoolId?: string | null
  schoolCode?: string | null
  authorizedSchools?: string[]
  isSuperAdmin?: boolean
}

export interface AuthenticationContext {
  user: AuthenticatedUser
  ipAddress?: string
  userAgent?: string
}

export interface EnhancedAuthConfig {
  /** Single role or list of roles allowed to access the route */
  requiredRoles?: UserRole | UserRole[]
  /** If true, the user must have a schoolId in their token */
  requireSchoolContext?: boolean
  /** If provided, the user's schoolId must be in this list */
  allowedSchoolIds?: string[]
}

export type EnhancedAuthResult =
  | { success: true; context: AuthenticationContext }
  | { success: false; error: string; statusCode: number }

/**
 * Authenticate a request using the NextAuth JWT token.
 * Validates role, school context, and school access as configured.
 */
export async function enhancedAuthenticate(
  request: NextRequest,
  config: EnhancedAuthConfig = {}
): Promise<EnhancedAuthResult> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token || !token.id) {
    return { success: false, error: "Unauthorized", statusCode: 401 }
  }

  const user: AuthenticatedUser = {
    id: token.id as string,
    email: token.email as string | null,
    mobile: token.mobile as string | null,
    name: token.name as string | null,
    role: token.role as UserRole,
    schoolId: token.schoolId as string | null,
    schoolCode: token.schoolCode as string | null,
    authorizedSchools: (token.authorizedSchools as string[]) || [],
    isSuperAdmin: token.role === UserRole.SUPER_ADMIN,
  }

  // Role check
  if (config.requiredRoles) {
    const allowed = Array.isArray(config.requiredRoles)
      ? config.requiredRoles
      : [config.requiredRoles]

    // Super admins bypass role restrictions
    if (!user.isSuperAdmin && !allowed.includes(user.role)) {
      return { success: false, error: "Forbidden", statusCode: 403 }
    }
  }

  // School context check
  if (config.requireSchoolContext && !user.isSuperAdmin && !user.schoolId) {
    return { success: false, error: "School context required", statusCode: 403 }
  }

  // School access check
  if (config.allowedSchoolIds && config.allowedSchoolIds.length > 0 && !user.isSuperAdmin) {
    const hasAccess =
      user.schoolId && config.allowedSchoolIds.includes(user.schoolId)
    if (!hasAccess) {
      return { success: false, error: "Access to this school is not permitted", statusCode: 403 }
    }
  }

  const context: AuthenticationContext = {
    user,
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  }

  return { success: true, context }
}
