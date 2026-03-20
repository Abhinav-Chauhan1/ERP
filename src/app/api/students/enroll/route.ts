import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";

// POST /api/students/enroll - Enroll a student into a class/section
export const POST = withSchoolAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { studentId, classId, sectionId } = body;

    if (!studentId || !classId || !sectionId) {
      return NextResponse.json(
        { error: "studentId, classId, and sectionId are required" },
        { status: 400 }
      );
    }

    // Verify student belongs to this school
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId: context.schoolId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Verify class belongs to this school
    const classRecord = await db.class.findFirst({
      where: { id: classId, schoolId: context.schoolId },
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Verify section belongs to this class
    const section = await db.classSection.findFirst({
      where: { id: sectionId, classId },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Deactivate any existing active enrollments for this student
    await db.classEnrollment.updateMany({
      where: { studentId, schoolId: context.schoolId, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    // Create the new enrollment
    const enrollment = await db.classEnrollment.create({
      data: {
        studentId,
        classId,
        sectionId,
        schoolId: context.schoolId,
        status: "ACTIVE",
        enrollDate: new Date(),
      },
      include: {
        class: true,
        section: true,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error("Error enrolling student:", error);
    // Handle unique constraint violation (already enrolled in same class/section)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Student is already enrolled in this class and section" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 }
    );
  }
});
