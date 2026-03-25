import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentAchievements } from "@/lib/actions/student-achievements-actions";

export async function GET(request: NextRequest) {
  // C24 FIX: Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    // Only allow students to query their own data unless they are an admin/teacher
    const role = session.user.role;
    if (role === "STUDENT" && studentId && studentId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const result = await getStudentAchievements(studentId || undefined);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in achievements API:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to get achievements" },
      { status: 500 }
    );
  }
}
