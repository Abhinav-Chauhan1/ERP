import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";

// GET /api/students - Get all students for current school
export const GET = withSchoolAuth(async (request: NextRequest, context) => {
    try {
        const students = await db.student.findMany({
            where: {
                schoolId: context.schoolId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        active: true,
                    },
                },
                enrollments: {
                    include: {
                        class: true,
                        section: true,
                    },
                    where: {
                        status: "ACTIVE",
                    },
                    take: 1,
                },
            },
            orderBy: {
                user: {
                    firstName: "asc",
                },
            },
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
});
