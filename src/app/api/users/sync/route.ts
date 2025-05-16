import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncUser } from "@/app/actions/user";

// Specify Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Use the server action to sync user
    const user = await syncUser();
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
