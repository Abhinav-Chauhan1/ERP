import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { UserRole } from "@prisma/client"

interface SuperAdminUser {
  id: string
  email?: string | null
  name?: string | null
  role: UserRole
}

export type SuperAdminAuthResult =
  | { success: true; user: SuperAdminUser }
  | { success: false; error: string; response: NextResponse }

/**
 * Verify the request carries a valid SUPER_ADMIN JWT token.
 * Returns the user on success, or a ready-to-return NextResponse on failure.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<SuperAdminAuthResult> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token || !token.id) {
    return {
      success: false,
      error: "Unauthorized",
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (token.role !== UserRole.SUPER_ADMIN) {
    return {
      success: false,
      error: "Forbidden: Super admin access required",
      response: NextResponse.json(
        { error: "Forbidden: Super admin access required" },
        { status: 403 }
      ),
    }
  }

  return {
    success: true,
    user: {
      id: token.id as string,
      email: token.email as string | null,
      name: token.name as string | null,
      role: UserRole.SUPER_ADMIN,
    },
  }
}

/**
 * Convenience wrapper — returns the NextResponse directly when auth fails,
 * or null when the request is authorised (caller continues normally).
 */
export async function superAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const result = await requireSuperAdmin(request)
  if (!result.success) {
    return result.response
  }
  return null
}
