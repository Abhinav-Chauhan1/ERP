"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

interface SetupData {
    // School Details
    schoolName: string;
    schoolEmail: string;
    schoolPhone: string;
    schoolAddress: string;
    schoolWebsite: string;
    timezone: string;
    schoolLogo: string;
    tagline: string;

    // Admin Details
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
    adminPosition: string;

    // Academic Year
    academicYearName: string;
    academicYearStart: Date | null;
    academicYearEnd: Date | null;

    // Terms
    terms: {
        name: string;
        startDate: Date | null;
        endDate: Date | null;
    }[];

    // Classes
    selectedClasses: string[];
    sections: string[];
}

/**
 * Check if onboarding has been completed
 */
export async function checkOnboardingStatus() {
    try {
        const settings = await db.systemSettings.findFirst();
        const adminCount = await db.user.count({
            where: { role: "ADMIN" },
        });

        return {
            success: true,
            data: {
                onboardingCompleted: settings?.onboardingCompleted ?? false,
                currentStep: settings?.onboardingStep ?? 0,
                hasAdmin: adminCount > 0,
            },
        };
    } catch (error) {
        console.error("Error checking onboarding status:", error);
        return {
            success: false,
            error: "Failed to check onboarding status",
        };
    }
}

/**
 * Complete the entire setup wizard
 */
export async function completeSetup(data: SetupData) {
    try {
        // Validate required fields
        if (!data.schoolName || !data.schoolEmail || !data.schoolPhone) {
            return { success: false, error: "School information is incomplete" };
        }

        if (!data.adminEmail || !data.adminPassword || !data.adminFirstName || !data.adminLastName) {
            return { success: false, error: "Admin account information is incomplete" };
        }

        if (!data.academicYearName || !data.academicYearStart || !data.academicYearEnd) {
            return { success: false, error: "Academic year information is incomplete" };
        }

        // Check if admin email already exists
        const existingUser = await db.user.findUnique({
            where: { email: data.adminEmail },
        });

        if (existingUser) {
            return { success: false, error: "An account with this email already exists" };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

        // Use a transaction to ensure all data is created together
        const result = await db.$transaction(async (tx) => {
            // 1. Update or create system settings
            let settings = await tx.systemSettings.findFirst();

            if (settings) {
                settings = await tx.systemSettings.update({
                    where: { id: settings.id },
                    data: {
                        schoolName: data.schoolName,
                        schoolEmail: data.schoolEmail,
                        schoolPhone: data.schoolPhone,
                        schoolAddress: data.schoolAddress || null,
                        schoolWebsite: data.schoolWebsite || null,
                        timezone: data.timezone,
                        schoolLogo: data.schoolLogo || null,
                        tagline: data.tagline || null,
                        onboardingCompleted: true,
                        onboardingStep: 7,
                    },
                });
            } else {
                settings = await tx.systemSettings.create({
                    data: {
                        schoolName: data.schoolName,
                        schoolEmail: data.schoolEmail,
                        schoolPhone: data.schoolPhone,
                        schoolAddress: data.schoolAddress || null,
                        schoolWebsite: data.schoolWebsite || null,
                        timezone: data.timezone,
                        schoolLogo: data.schoolLogo || null,
                        tagline: data.tagline || null,
                        onboardingCompleted: true,
                        onboardingStep: 7,
                        // Default values
                        defaultGradingScale: "PERCENTAGE",
                        passingGrade: 50,
                        emailEnabled: true,
                        defaultTheme: "LIGHT",
                        language: "en",
                    },
                });
            }

            // 2. Create admin user
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    firstName: data.adminFirstName,
                    lastName: data.adminLastName,
                    name: `${data.adminFirstName} ${data.adminLastName}`,
                    phone: data.adminPhone || null,
                    role: "ADMIN",
                    active: true,
                },
            });

            // 3. Create administrator profile
            await tx.administrator.create({
                data: {
                    userId: adminUser.id,
                    position: data.adminPosition || "Administrator",
                    department: "Administration",
                },
            });

            // 4. Create academic year (dates are validated above)
            const academicYear = await tx.academicYear.create({
                data: {
                    name: data.academicYearName,
                    startDate: data.academicYearStart as Date,
                    endDate: data.academicYearEnd as Date,
                    isCurrent: true,
                },
            });

            // Update settings with current academic year
            await tx.systemSettings.update({
                where: { id: settings.id },
                data: {
                    currentAcademicYear: academicYear.id,
                },
            });

            // 5. Create terms
            const createdTerms = [];
            for (const term of data.terms) {
                if (term.name && term.startDate && term.endDate) {
                    const createdTerm = await tx.term.create({
                        data: {
                            name: term.name,
                            academicYearId: academicYear.id,
                            startDate: term.startDate,
                            endDate: term.endDate,
                        },
                    });
                    createdTerms.push(createdTerm);
                }
            }

            // Set first term as current
            if (createdTerms.length > 0) {
                await tx.systemSettings.update({
                    where: { id: settings.id },
                    data: {
                        currentTerm: createdTerms[0].id,
                    },
                });
            }

            // 6. Create classes and sections (if any selected)
            for (const className of data.selectedClasses) {
                const createdClass = await tx.class.create({
                    data: {
                        name: className,
                        academicYearId: academicYear.id,
                    },
                });

                // Create sections for each class
                for (const sectionName of data.sections) {
                    await tx.classSection.create({
                        data: {
                            name: sectionName,
                            classId: createdClass.id,
                            capacity: 40, // Default capacity
                        },
                    });
                }
            }

            // 7. Create default grade scale
            const gradeScales = [
                { grade: "A+", minMarks: 90, maxMarks: 100, gpa: 10, description: "Outstanding" },
                { grade: "A", minMarks: 80, maxMarks: 89, gpa: 9, description: "Excellent" },
                { grade: "B+", minMarks: 70, maxMarks: 79, gpa: 8, description: "Very Good" },
                { grade: "B", minMarks: 60, maxMarks: 69, gpa: 7, description: "Good" },
                { grade: "C+", minMarks: 50, maxMarks: 59, gpa: 6, description: "Above Average" },
                { grade: "C", minMarks: 40, maxMarks: 49, gpa: 5, description: "Average" },
                { grade: "D", minMarks: 33, maxMarks: 39, gpa: 4, description: "Below Average" },
                { grade: "F", minMarks: 0, maxMarks: 32, gpa: 0, description: "Fail" },
            ];

            for (const scale of gradeScales) {
                await tx.gradeScale.create({ data: scale });
            }

            // 8. Create default exam types
            const examTypes = [
                { name: "Unit Test", description: "Regular unit assessment", weight: 10, isActive: true, includeInGradeCard: true },
                { name: "Mid-Term Exam", description: "Mid-term examination", weight: 30, isActive: true, includeInGradeCard: true },
                { name: "Final Exam", description: "End of term examination", weight: 50, isActive: true, includeInGradeCard: true },
                { name: "Practical", description: "Practical examination", weight: 10, isActive: true, includeInGradeCard: true },
            ];

            for (const examType of examTypes) {
                await tx.examType.create({ data: examType });
            }

            return {
                settings,
                adminUser,
                academicYear,
                termsCount: createdTerms.length,
                classesCount: data.selectedClasses.length,
            };
        });

        // Revalidate paths
        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/setup");

        return {
            success: true,
            data: {
                message: "Setup completed successfully",
                adminEmail: result.adminUser.email,
                academicYear: result.academicYear.name,
            },
        };
    } catch (error) {
        console.error("Error completing setup:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to complete setup",
        };
    }
}

/**
 * Update onboarding step progress
 */
export async function updateOnboardingStep(step: number) {
    try {
        let settings = await db.systemSettings.findFirst();

        if (settings) {
            await db.systemSettings.update({
                where: { id: settings.id },
                data: { onboardingStep: step },
            });
        } else {
            await db.systemSettings.create({
                data: {
                    schoolName: "School Name",
                    timezone: "UTC",
                    onboardingStep: step,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating onboarding step:", error);
        return { success: false, error: "Failed to update progress" };
    }
}
