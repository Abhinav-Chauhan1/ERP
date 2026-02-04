import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";

export async function POST(request: NextRequest) {
    try {
        // Get school context
        const context = await getCurrentUserSchoolContext();

        if (!context?.schoolId) {
            return NextResponse.json(
                { error: "School context required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { studentId, classId, sectionId } = body;

        if (!studentId || !classId || !sectionId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify student belongs to the same school
        const student = await db.student.findFirst({
            where: {
                id: studentId,
                schoolId: context.schoolId,
            },
        });

        if (!student) {
            return NextResponse.json(
                { error: "Student not found or access denied" },
                { status: 404 }
            );
        }

        // Verify class and section belong to the same school
        const classData = await db.class.findFirst({
            where: {
                id: classId,
                schoolId: context.schoolId,
            },
        });

        const section = await db.classSection.findFirst({
            where: {
                id: sectionId,
                classId: classId,
            },
        });

        if (!classData || !section) {
            return NextResponse.json(
                { error: "Class or section not found" },
                { status: 404 }
            );
        }

        // Check if enrollment already exists
        const existingEnrollment = await db.classEnrollment.findFirst({
            where: {
                studentId,
                classId,
                sectionId,
            },
        });

        if (existingEnrollment) {
            return NextResponse.json(
                { error: "Student is already enrolled in this class and section" },
                { status: 400 }
            );
        }

        // Create enrollment
        const enrollment = await db.classEnrollment.create({
            data: {
                studentId,
                classId,
                sectionId,
                enrollDate: new Date(),
                status: "ACTIVE",
                schoolId: context.schoolId,
            },
        });

        return NextResponse.json(
            { success: true, enrollment },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Enrollment API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
