import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { completeSetup } from "@/lib/actions/onboarding/setup-actions";

// Increase timeout for setup operations
export const maxDuration = 60; // 60 seconds

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Require super admin access
    await requireSuperAdminAccess();

    const { id: schoolId } = await params;
    const setupData = await request.json();

    console.log("Setup wizard API called for school:", schoolId);

    // Add schoolId to the setup data
    const dataWithSchoolId = { ...setupData, schoolId };

    // Call the setup completion function
    const result = await completeSetup(dataWithSchoolId);

    if (!result.success) {
      console.error("Setup completion failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("Setup completion successful");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Setup completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete setup" },
      { status: 500 }
    );
  }
}