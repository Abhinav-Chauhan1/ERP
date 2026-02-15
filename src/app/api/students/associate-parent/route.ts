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

        // Get schoolId from student record
        const student = await db.student.findUnique({
            where: { id: studentId },
            select: { schoolId: true }
        });

        if (!student) {
            return NextResponse.json(
                { message: "Student not found" },
                { status: 404 }
            );
        }

        // Verify parent exists and belongs to same school
        const parent = await db.parent.findUnique({
            where: { id: parentId },
            select: { schoolId: true }
        });

        if (!parent) {
            return NextResponse.json(
                { message: "Parent not found" },
                { status: 404 }
            );
        }

        if (parent.schoolId !== student.schoolId) {
            return NextResponse.json(
                { message: "Parent and student must belong to the same school" },
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
                schoolId: student.schoolId,
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
