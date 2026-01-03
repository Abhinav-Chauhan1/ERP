import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * User Sync API
 * Syncs user data with the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        administrator: true,
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
