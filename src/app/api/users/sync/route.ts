import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/user-handler";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Ensure user exists in database
    const user = await ensureUserExists(userId);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
