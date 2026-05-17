import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// POST /api/students/associate-parent - Associate a parent with a student
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const context = await requireSchoolAccess();
        const schoolId = context.isSuperAdmin ? undefined : context.schoolId!;

        const body = await request.json();
        const { studentId, parentId, isPrimary } = body;

        if (!studentId || !parentId) {
            return NextResponse.json(
                { message: "Student ID and Parent ID are required" },
                { status: 400 }
            );
        }

        // Verify student belongs to the current school (prevents cross-tenant access)
        const student = await db.student.findFirst({
            where: { id: studentId, ...(schoolId ? { schoolId } : {}) },
            select: { schoolId: true }
        });

        if (!student) {
            return NextResponse.json(
                { message: "Student not found" },
                { status: 404 }
            );
        }

        // Verify parent exists and belongs to same school
        const parent = await db.parent.findFirst({
            where: { id: parentId, schoolId: student.schoolId },
            select: { schoolId: true }
        });

        if (!parent) {
            return NextResponse.json(
                { message: "Parent not found or does not belong to this school" },
                { status: 404 }
            );
        }

        // Check if association already exists
        const existingAssociation = await db.studentParent.findFirst({
            where: { studentId, parentId },
        });

        if (existingAssociation) {
            return NextResponse.json(
                { message: "This parent is already associated with the student" },
                { status: 400 }
            );
        }

        // If setting as primary, unset any existing primary parent — scoped to this school via student
        if (isPrimary) {
            await db.studentParent.updateMany({
                where: {
                    studentId,
                    isPrimary: true,
                    student: { schoolId: student.schoolId },
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
