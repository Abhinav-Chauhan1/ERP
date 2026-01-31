"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getCurrentSchoolId } from "@/lib/auth/tenant";

interface SetupData {
    // School Details (only needed for initial system setup)
    schoolName?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    schoolAddress?: string;
    schoolWebsite?: string;
    timezone?: string;
    schoolLogo?: string;
    tagline?: string;

    // Admin Details (only for initial system setup)
    adminFirstName?: string;
    adminLastName?: string;
    adminEmail?: string;
    adminPassword?: string;
    adminPhone?: string;
    adminPosition?: string;

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
 * Check if onboarding has been completed for the current school
 */
export async function checkOnboardingStatus() {
    try {
        const schoolId = await getCurrentSchoolId();

        if (!schoolId) {
            // If no school context, check if system has any schools
            const schoolCount = await db.school.count();
            return {
                success: true,
                data: {
                    onboardingCompleted: schoolCount > 0,
                    currentStep: schoolCount > 0 ? 7 : 0,
                    hasAdmin: false, // Not relevant for per-school setup
                    systemSetupRequired: schoolCount === 0,
                },
            };
        }

        const school = await db.school.findUnique({
            where: { id: schoolId },
            select: {
                isOnboarded: true,
                onboardingStep: true,
                onboardingCompletedAt: true,
            },
        });

        if (!school) {
            return {
                success: false,
                error: "School not found",
            };
        }

        return {
            success: true,
            data: {
                onboardingCompleted: school.isOnboarded,
                currentStep: school.onboardingStep,
                hasAdmin: true, // School exists, so admin exists
                systemSetupRequired: false,
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
 * Complete the setup wizard - handles both system setup and school setup
 */
export async function completeSetup(data: SetupData) {
    try {
        const currentSchoolId = await getCurrentSchoolId();

        if (!currentSchoolId) {
            // System setup - creating the first school
            return await completeSystemSetup(data);
        } else {
            // School setup - setting up an existing school
            return await completeSchoolSetup(currentSchoolId, data);
        }
    } catch (error) {
        console.error("Error completing setup:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to complete setup",
        };
    }
}

/**
 * Complete system setup (create first school and admin)
 */
async function completeSystemSetup(data: SetupData) {
    // Validate required fields for system setup
    if (!data.schoolName || !data.schoolEmail || !data.schoolPhone) {
        return { success: false, error: "School information is incomplete" };
    }

    if (!data.adminEmail || !data.adminPassword || !data.adminFirstName || !data.adminLastName) {
        return { success: false, error: "Admin account information is incomplete" };
    }

    if (!data.schoolName) {
        return { success: false, error: "School name is required" };
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
        // Generate unique school code
        const schoolCode = `SCHOOL${Date.now().toString().slice(-6)}`;

        // 1. Create the school
        const school = await tx.school.create({
            data: {
                name: data.schoolName!, // Safe to use ! because we validated above
                schoolCode,
                email: data.schoolEmail,
                phone: data.schoolPhone,
                address: data.schoolAddress,
                domain: data.schoolWebsite, // Map website to domain field
                tagline: data.tagline,
                plan: "STARTER",
                status: "ACTIVE",
                isOnboarded: false, // Will be set to true at the end
                onboardingStep: 0,
            },
        });

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
                schoolId: school.id,
                position: data.adminPosition || "Administrator",
            },
        });

        // 4. Create user-school relationship
        await tx.userSchool.create({
            data: {
                userId: adminUser.id,
                schoolId: school.id,
                role: "ADMIN",
                isActive: true,
            },
        });

        // 5. Create default subscription (free trial)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days trial

        await tx.subscription.create({
            data: {
                schoolId: school.id,
                billingCycle: "MONTHLY",
                startDate: new Date(),
                endDate: trialEndDate,
                isActive: true,
                paymentStatus: "PAID", // Trial is free
            },
        });

        // 6. Create usage counter
        await tx.usageCounter.create({
            data: {
                schoolId: school.id,
                month: new Date().toISOString().slice(0, 7), // YYYY-MM format
                whatsappLimit: 100, // Starter plan limits
                smsLimit: 100,
                storageLimitMB: 1024, // 1GB
            },
        });

        return {
            school,
            adminUser,
        };
    });

    // Now complete school setup
    const schoolSetupResult = await completeSchoolSetup(result.school.id, data);

    if (!schoolSetupResult.success) {
        return schoolSetupResult;
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/setup");

    return {
        success: true,
        data: {
            message: "System setup completed successfully",
            adminEmail: result.adminUser.email,
            schoolCode: result.school.schoolCode,
        },
    };
}

/**
 * Complete school setup (set up academic structure for existing school)
 */
async function completeSchoolSetup(schoolId: string, data: SetupData) {
    if (!data.academicYearName || !data.academicYearStart || !data.academicYearEnd) {
        return { success: false, error: "Academic year information is incomplete" };
    }

    // Use a transaction to ensure all data is created together
    const result = await db.$transaction(async (tx) => {
        // 1. Create academic year
        const academicYear = await tx.academicYear.create({
            data: {
                schoolId,
                name: data.academicYearName,
                startDate: data.academicYearStart as Date,
                endDate: data.academicYearEnd as Date,
                isCurrent: true,
            },
        });

        // 2. Create terms
        const createdTerms = [];
        for (const term of data.terms) {
            if (term.name && term.startDate && term.endDate) {
                const createdTerm = await tx.term.create({
                    data: {
                        schoolId,
                        name: term.name,
                        academicYearId: academicYear.id,
                        startDate: term.startDate,
                        endDate: term.endDate,
                    },
                });
                createdTerms.push(createdTerm);
            }
        }

        // 3. Create classes and sections
        for (const className of data.selectedClasses) {
            const createdClass = await tx.class.create({
                data: {
                    schoolId,
                    name: className,
                    academicYearId: academicYear.id,
                },
            });

            // Create sections for each class
            for (const sectionName of data.sections) {
                await tx.classSection.create({
                    data: {
                        schoolId,
                        name: sectionName,
                        classId: createdClass.id,
                        capacity: 40, // Default capacity
                    },
                });
            }
        }

        // 4. Create default grade scale
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
            await tx.gradeScale.create({
                data: {
                    schoolId,
                    ...scale
                }
            });
        }

        // 5. Create default exam types
        const examTypes = [
            { name: "Unit Test", description: "Regular unit assessment", weight: 10, isActive: true, includeInGradeCard: true },
            { name: "Mid-Term Exam", description: "Mid-term examination", weight: 30, isActive: true, includeInGradeCard: true },
            { name: "Final Exam", description: "End of term examination", weight: 50, isActive: true, includeInGradeCard: true },
            { name: "Practical", description: "Practical examination", weight: 10, isActive: true, includeInGradeCard: true },
        ];

        for (const examType of examTypes) {
            await tx.examType.create({
                data: {
                    schoolId,
                    ...examType
                }
            });
        }

        // 6. Mark school as onboarded
        await tx.school.update({
            where: { id: schoolId },
            data: {
                isOnboarded: true,
                onboardingStep: 7,
                onboardingCompletedAt: new Date(),
            },
        });

        return {
            academicYear,
            termsCount: createdTerms.length,
            classesCount: data.selectedClasses.length,
        };
    });

    // Update detailed progress tracking to mark all steps as completed
    try {
        const { OnboardingProgressService } = await import("@/lib/services/onboarding-progress-service");
        
        // Mark all required steps as completed
        for (let step = 1; step <= 7; step++) {
            await OnboardingProgressService.updateStepProgress(
                schoolId,
                step,
                'completed',
                { completedVia: 'setup_wizard', timestamp: new Date() }
            );
        }
    } catch (progressError) {
        console.warn("Failed to update detailed progress tracking:", progressError);
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/setup");

    return {
        success: true,
        data: {
            message: "School setup completed successfully",
            academicYear: result.academicYear.name,
        },
    };
}

/**
 * Update onboarding step progress for the current school
 * Enhanced to work with detailed progress tracking (Task 9.5)
 */
export async function updateOnboardingStep(step: number, metadata?: Record<string, any>) {
    try {
        const schoolId = await getCurrentSchoolId();

        if (!schoolId) {
            return { success: false, error: "No school context found" };
        }

        // Update basic school field for backward compatibility
        await db.school.update({
            where: { id: schoolId },
            data: { onboardingStep: step },
        });

        // Also update detailed progress tracking if available
        try {
            const { OnboardingProgressService } = await import("@/lib/services/onboarding-progress-service");
            await OnboardingProgressService.updateStepProgress(
                schoolId,
                step,
                'in_progress',
                metadata
            );
        } catch (progressError) {
            // Don't fail the main operation if progress tracking fails
            console.warn("Failed to update detailed progress tracking:", progressError);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating onboarding step:", error);
        return { success: false, error: "Failed to update progress" };
    }
}
