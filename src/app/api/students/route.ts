import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";

// GET /api/students - Get paginated students for current school
export const GET = withSchoolAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url);

        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        const where = { schoolId: context.schoolId };

        const [students, total] = await Promise.all([
            db.student.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatar: true,
                            isActive: true,
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
                take: limit,
                skip,
            }),
            db.student.count({ where }),
        ]);

        return NextResponse.json({
            data: students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
});
