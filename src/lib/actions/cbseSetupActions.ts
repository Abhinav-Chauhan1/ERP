"use strict";

import { prisma } from "@/lib/prisma";
import { CBSE_SUBJECTS } from "@/lib/constants/cbse-subjects";
import { revalidatePath } from "next/cache";

/**
 * Seeds the standard CBSE 9-point grading scale
 */
export async function seedCBSEGradeScale() {
    const cbseGrades = [
        { grade: "A1", minMarks: 91, maxMarks: 100, gradePoint: 10.0, description: "Top 1/8th of passed candidates" },
        { grade: "A2", minMarks: 81, maxMarks: 90, gradePoint: 9.0, description: "Next 1/8th" },
        { grade: "B1", minMarks: 71, maxMarks: 80, gradePoint: 8.0, description: "Next 1/8th" },
        { grade: "B2", minMarks: 61, maxMarks: 70, gradePoint: 7.0, description: "Next 1/8th" },
        { grade: "C1", minMarks: 51, maxMarks: 60, gradePoint: 6.0, description: "Next 1/8th" },
        { grade: "C2", minMarks: 41, maxMarks: 50, gradePoint: 5.0, description: "Next 1/8th" },
        { grade: "D", minMarks: 33, maxMarks: 40, gradePoint: 4.0, description: "Next 1/8th" },
        { grade: "E", minMarks: 0, maxMarks: 32, gradePoint: 0.0, description: "Essential Repeat" },
    ];

    for (const g of cbseGrades) {
        await prisma.gradeScale.upsert({
            where: {
                boardType_grade: {
                    boardType: "CBSE",
                    grade: g.grade,
                },
            },
            update: {
                minMarks: g.minMarks,
                maxMarks: g.maxMarks,
                gradePoint: g.gradePoint,
                description: g.description,
            },
            create: {
                boardType: "CBSE",
                grade: g.grade,
                minMarks: g.minMarks,
                maxMarks: g.maxMarks,
                gradePoint: g.gradePoint,
                description: g.description,
            },
        });
    }

    revalidatePath("/admin/academic/grades");
    return { success: true, message: "CBSE Grade Scale seeded successfully" };
}

/**
 * Seeds CBSE Subjects and Departments
 */
export async function seedCBSESubjects() {
    // 1. Ensure departments exist
    const departments = Array.from(new Set(CBSE_SUBJECTS.map(s => s.department)));

    for (const deptName of departments) {
        await prisma.department.upsert({
            where: { name: deptName }, // Assuming name is unique or using name as identifier
            update: {},
            create: { name: deptName },
        });
    }

    // 2. Create subjects
    for (const s of CBSE_SUBJECTS) {
        const dept = await prisma.department.findFirst({ where: { name: s.department } });

        await prisma.subject.upsert({
            where: { code: s.code },
            update: {
                name: s.name,
                type: s.type as any,
                departmentId: dept?.id,
            },
            create: {
                name: s.name,
                code: s.code,
                type: s.type as any,
                departmentId: dept?.id,
            },
        });
    }

    revalidatePath("/admin/academic/subjects");
    return { success: true, message: "CBSE Subjects and Departments seeded successfully" };
}
