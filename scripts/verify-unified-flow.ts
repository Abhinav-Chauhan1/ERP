
import { db } from "@/lib/db";
import { SyllabusStatus, AssessmentType } from "@prisma/client";

async function main() {
    console.log("Starting Unified Syllabus Flow Verification...");

    // 1. Cleanup previous test data
    const subjectCode = "TEST-SCI-101";
    await db.syllabus.deleteMany({
        where: { subject: { code: subjectCode } }
    });
    await db.subject.deleteMany({
        where: { code: subjectCode }
    });

    // 2. Create Subject
    console.log("Creating Subject...");
    const subject = await db.subject.create({
        data: {
            name: "Test Science",
            code: subjectCode,
            type: "CORE",
        }
    });

    // 3. Create Unified Syllabus (Board Compatible)
    console.log("Creating Unified Syllabus...");
    const syllabus = await db.syllabus.create({
        data: {
            title: "Science Class 10 - CBSE",
            subjectId: subject.id,
            boardType: "CBSE",
            curriculumType: "GENERAL",
            assessmentType: AssessmentType.GRADED, // New Field
            status: SyllabusStatus.PUBLISHED,
            createdBy: "test-script",
            modules: {
                create: [
                    {
                        title: "Chemical Reactions",
                        chapterNumber: 1,
                        term: "Term 1", // New Field
                        weightage: 5.0, // New Field
                        order: 1,
                        subModules: {
                            create: [
                                { title: "Chemical Equations", order: 1 },
                                { title: "Types of Reactions", order: 2 }
                            ]
                        }
                    },
                    {
                        title: "Acids, Bases and Salts",
                        chapterNumber: 2,
                        term: "Term 1",
                        weightage: 6.0,
                        order: 2,
                        subModules: {
                            create: [
                                { title: "Properties of Acids", order: 1 }
                            ]
                        }
                    }
                ]
            }
        },
        include: {
            modules: {
                include: {
                    subModules: true
                }
            }
        }
    });

    // 4. Verification
    console.log("Verifying Created Data...");
    if (syllabus.assessmentType !== "GRADED") throw new Error("Assessment Type mismatch");

    const m1 = syllabus.modules.find(m => m.chapterNumber === 1);
    if (!m1) throw new Error("Module 1 not found");
    if (m1.term !== "Term 1") throw new Error("Term mismatch");
    if (m1.weightage !== 5.0) throw new Error("Weightage mismatch");
    if (m1.subModules.length !== 2) throw new Error("SubModule count mismatch");

    console.log("✅ Verification Successful!");
    console.log("Created Syllabus ID:", syllabus.id);
    console.log("Modules:", syllabus.modules.length);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
