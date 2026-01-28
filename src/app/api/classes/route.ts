import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";

export const GET = withSchoolAuth(async (request: NextRequest, context) => {
  try {
    const classes = await db.class.findMany({
      where: {
        schoolId: context.schoolId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
