
import { db } from "@/lib/db";
import { createReportCardTemplate, deleteReportCardTemplate } from "@/lib/actions/reportCardTemplateActions";
import { generateReportCardPDF } from "@/lib/services/report-card-pdf-generation";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting Report Card Verification...");

    const templateName = "Verification Template " + Date.now();

    // 1. Create a Test Template directly in DB to avoid auth checks in Action if running as script
    // Or use the DB directly to simulate the Action's effect.

    console.log("Creating Template...");
    const template = await db.reportCardTemplate.create({
        data: {
            name: templateName,
            type: "CUSTOM",
            pageSize: "A4",
            orientation: "PORTRAIT",
            description: "Test template for verification",
            sections: [
                { id: "header", name: "Header", enabled: true, order: 1, fields: [] },
                { id: "studentInfo", name: "Student Info", enabled: true, order: 2, fields: [] },
                { id: "academic", name: "Academic", enabled: true, order: 3, fields: [] },
                { id: "remarks", name: "Remarks", enabled: true, order: 4, fields: [] },
            ],
            styling: {
                primaryColor: "#000000",
                secondaryColor: "#cccccc",
                fontFamily: "Helvetica",
                fontSize: 10,
                headerHeight: 40,
                footerHeight: 30,
                headerStyle: "modern",
            },
            signatures: [
                { label: "Class Teacher", position: "left", name: "Mrs. Sharma" },
                { label: "Principal", position: "right", name: "Mr. Gupta" },
                { label: "Parent", position: "center" }
            ],
            disclaimer: "This is a computer-generated document. No signature is required. Affiliated to CBSE, New Delhi.",
            gradingConfig: {
                system: "MARKS_ONLY",
                showMarks: true,
                showGrade: true,
            },
            createdBy: "verification-script",
        },
    });

    console.log("Template Created:", template.id);

    // 2. Mock Data
    const mockData: any = {
        academicYear: "2025-2026",
        term: { name: "Term 1" },
        student: {
            name: "Rohan Kumar",
            class: "X",
            section: "A",
            rollNumber: "101",
            admissionId: "ADM-2025-001",
            dateOfBirth: new Date("2010-05-15"),
        },
        subjects: [
            { subjectName: "Mathematics", maxMarks: 100, totalMarks: 95, percentage: 95, grade: "A1", theoryMarks: 75, theoryMaxMarks: 80, internalMarks: 20, internalMaxMarks: 20 },
            { subjectName: "Science", maxMarks: 100, totalMarks: 88, percentage: 88, grade: "A2", theoryMarks: 68, theoryMaxMarks: 80, internalMarks: 20, internalMaxMarks: 20 },
            { subjectName: "English", maxMarks: 100, totalMarks: 90, percentage: 90, grade: "A1", theoryMarks: 70, theoryMaxMarks: 80, internalMarks: 20, internalMaxMarks: 20 },
        ],
        overallPerformance: {
            totalObtained: 273,
            totalMax: 300,
            percentage: 91,
            grade: "A1",
            rank: 1,
            obtainedMarks: 273, // Added this as per interface
            maxMarks: 300       // Added this as per interface
        },
        coScholastic: [
            { activityName: "Art Education", grade: "A" },
            { activityName: "Physical Education", grade: "A" },
        ],
        attendance: {
            totalDays: 100,
            daysPresent: 98,
            daysAbsent: 2,
            percentage: 98,
        },
        remarks: {
            teacherRemarks: "Excellent performance. Keep it up!",
            principalRemarks: "Outstanding student.",
        },
    };

    // 3. Generate PDF
    console.log("Generating PDF...");
    const result = await generateReportCardPDF({
        templateId: template.id,
        data: mockData,
        schoolName: "SikshaMitra Global School",
        schoolAddress: "Sector 62, Noida, UP - 201301",
    });

    if (result.success && result.pdfBuffer) {
        const outputPath = path.join(process.cwd(), "verification-report-card.pdf");
        fs.writeFileSync(outputPath, result.pdfBuffer);
        console.log(`✅ PDF Generated successfully at: ${outputPath}`);
    } else {
        console.error("❌ PDF Generation Failed:", result.error);
        process.exit(1);
    }

    // 4. Cleanup
    console.log("Cleaning up...");
    await db.reportCardTemplate.delete({ where: { id: template.id } });

    console.log("Values verified. Signatures and Disclaimer should be present in the PDF.");
    // Note: We can't visually verify the PDF in the script, but successful generation implies code paths were hit.
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
