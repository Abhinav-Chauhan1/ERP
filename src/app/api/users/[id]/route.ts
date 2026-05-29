import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Specify Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role as UserRole;
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const context = await requireSchoolAccess();

    const whereClause = context.isSuperAdmin
      ? { id }
      : { id, userSchools: { some: { schoolId: context.schoolId! } } };

    const user = await db.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        mustChangePassword: true,
        avatar: true,
        // passwordHash, twoFactorSecret, twoFactorBackupCodes intentionally excluded
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role as UserRole;
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { role: newRole } = body;

    if (!Object.values(UserRole).includes(newRole)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    // Only SUPER_ADMINs can assign the SUPER_ADMIN role
    if (newRole === UserRole.SUPER_ADMIN && role !== UserRole.SUPER_ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const context = await requireSchoolAccess();

    const whereClause = context.isSuperAdmin
      ? { id }
      : { id, userSchools: { some: { schoolId: context.schoolId! } } };

    // Verify target user belongs to this school before updating
    const target = await db.user.findFirst({ where: whereClause });
    if (!target) {
      return new NextResponse("User not found", { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
