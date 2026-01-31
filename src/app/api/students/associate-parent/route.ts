import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// POST /api/students/associate-parent - Associate a parent with a student
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { studentId, parentId, isPrimary } = body;

        if (!studentId || !parentId) {
            return NextResponse.json(
                { message: "Student ID and Parent ID are required" },
                { status: 400 }
            );
        }

        // Check if association already exists
        const existingAssociation = await db.studentParent.findFirst({
            where: {
                studentId,
                parentId,
            },
        });

        if (existingAssociation) {
            return NextResponse.json(
                { message: "This parent is already associated with the student" },
                { status: 400 }
            );
        }

        // If setting as primary, unset any existing primary parent
        if (isPrimary) {
            await db.studentParent.updateMany({
                where: {
                    studentId,
                    isPrimary: true,
                },
                data: {
                    isPrimary: false,
                },
            });
        }

        // Create the association
        const association = await db.studentParent.create({
            data: {
                studentId,
                parentId,
                schoolId: "school-id", // TODO: Get from context
                isPrimary: isPrimary || false,
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                parent: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Parent associated successfully",
            data: association,
        });
    } catch (error) {
        console.error("Error associating parent:", error);
        return NextResponse.json(
            { message: "Failed to associate parent" },
            { status: 500 }
        );
    }
}
