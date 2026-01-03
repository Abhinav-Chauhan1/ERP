import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const sections = await db.classSection.findMany({
      where: {
        classId: id
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
