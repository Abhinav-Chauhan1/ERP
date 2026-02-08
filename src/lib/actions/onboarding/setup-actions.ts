"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getCurrentSchoolId } from "@/lib/auth/tenant";
import crypto from "crypto";
import { sendEmail } from "@/lib/utils/email-service";
import { getVerificationEmailHtml } from "@/lib/utils/email-templates";

interface SetupData {
    // School ID for super admin context
    schoolId?: string;

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
    console.log("completeSetup called with data:", {
        schoolId: data.schoolId,
        academicYearName: data.academicYearName,
        hasSchoolName: !!data.schoolName,
        hasAdminEmail: !!data.adminEmail
    });

    try {
        // If schoolId is explicitly provided (super admin context), use it
        if (data.schoolId) {
            console.log("Using provided schoolId for school setup:", data.schoolId);
            return await completeSchoolSetup(data.schoolId, data);
        }

        // Otherwise, try to get current school context
        const currentSchoolId = await getCurrentSchoolId();
        console.log("Current school ID from context:", currentSchoolId);

        if (!currentSchoolId) {
            // System setup - creating the first school
            console.log("No current school ID, performing system setup");
            return await completeSystemSetup(data);
        } else {
            // School setup - setting up an existing school
            console.log("Using current school ID for school setup:", currentSchoolId);
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
                passwordHash: hashedPassword,
                firstName: data.adminFirstName,
                lastName: data.adminLastName,
                name: `${data.adminFirstName} ${data.adminLastName}`,
                phone: data.adminPhone || null,
                role: "ADMIN",
                active: true,
                emailVerified: new Date(), // Admin-created users are pre-verified
                // Set mobile to email if no separate mobile provided (for unified auth)
                mobile: data.adminEmail?.includes('@') ? null : data.adminEmail,
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

    // Generate and send email verification token
    try {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store verification token
        await db.verificationToken.create({
            data: {
                identifier: result.adminUser.email!,
                token: verificationToken,
                expires: verificationExpires,
            },
        });

        // Send verification email
        const verificationUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

        const emailHtml = getVerificationEmailHtml({
            userName: result.adminUser.firstName!,
            verificationUrl,
        });

        const emailResult = await sendEmail({
            to: [result.adminUser.email!],
            subject: "Verify Your Email - SikshaMitra",
            html: emailHtml,
        });

        if (!emailResult.success) {
            console.error("Failed to send verification email:", emailResult.error);
            // Don't fail setup if email fails, but log it
        }
    } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail setup if email sending fails
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/setup");

    return {
        success: true,
        data: {
            message: "System setup completed successfully. Please check your email to verify your account before logging in.",
            adminEmail: result.adminUser.email,
            schoolCode: result.school.schoolCode,
            requiresEmailVerification: true,
        },
    };
}

/**
 * Complete school setup (set up academic structure for existing school)
 */
async function completeSchoolSetup(schoolId: string, data: SetupData) {
    console.log("completeSchoolSetup called with:", {
        schoolId,
        academicYearName: data.academicYearName,
        academicYearStart: data.academicYearStart,
        academicYearEnd: data.academicYearEnd,
        termsCount: data.terms.length,
        classesCount: data.selectedClasses.length
    });

    if (!data.academicYearName || !data.academicYearStart || !data.academicYearEnd) {
        console.error("Academic year information is incomplete:", {
            academicYearName: data.academicYearName,
            academicYearStart: data.academicYearStart,
            academicYearEnd: data.academicYearEnd
        });
        return { success: false, error: "Academic year information is incomplete" };
    }

    // 0. Create/Update Admin User if provided (for schools created by super admin without admin)
    if (data.adminEmail) {
        try {
            console.log("Processing admin user for school:", schoolId);

            // Check if user already exists
            const existingUser = await db.user.findFirst({
                where: {
                    OR: [
                        { email: data.adminEmail },
                        { mobile: data.adminEmail }
                    ]
                }
            });

            let adminUserId = existingUser?.id;

            if (existingUser) {
                console.log("Found existing user:", existingUser.email);
                // Check if already linked as ADMIN
                const existingLink = await db.userSchool.findFirst({
                    where: {
                        userId: existingUser.id,
                        schoolId: schoolId,
                        role: "ADMIN"
                    }
                });

                if (!existingLink) {
                    console.log("Linking existing user as ADMIN");
                    await db.userSchool.create({
                        data: {
                            userId: existingUser.id,
                            schoolId: schoolId,
                            role: "ADMIN",
                            isActive: true
                        }
                    });
                }

                // Update password if provided
                if (data.adminPassword) {
                    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);
                    await db.user.update({
                        where: { id: existingUser.id },
                        data: { passwordHash: hashedPassword }
                    });
                    console.log("Updated existing admin password");
                }
            } else {
                console.log("Creating new admin user");
                // Create new user
                const hashedPassword = data.adminPassword
                    ? await bcrypt.hash(data.adminPassword, 12)
                    : null;

                const newUser = await db.user.create({
                    data: {
                        email: data.adminEmail,
                        passwordHash: hashedPassword,
                        firstName: data.adminFirstName || data.adminEmail.split('@')[0],
                        lastName: data.adminLastName || "Admin",
                        name: `${data.adminFirstName || ""} ${data.adminLastName || ""}`.trim() || "School Admin",
                        phone: data.adminPhone || null,
                        role: "ADMIN", // Explicitly set role
                        active: true,
                        emailVerified: new Date(), // Admin-created users are pre-verified
                        mobile: data.adminEmail.includes('@') ? null : data.adminEmail,
                    }
                });
                adminUserId = newUser.id;

                // Link to school
                await db.userSchool.create({
                    data: {
                        userId: newUser.id,
                        schoolId: schoolId,
                        role: "ADMIN",
                        isActive: true
                    }
                });

                // Create administrator profile
                await db.administrator.create({
                    data: {
                        userId: newUser.id,
                        schoolId: schoolId,
                        position: data.adminPosition || "Administrator",
                    },
                });

                console.log("Created new admin user and linked to school");

                // Send verification email for new admin
                try {
                    const verificationToken = crypto.randomBytes(32).toString("hex");
                    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                    // Store verification token
                    await db.verificationToken.create({
                        data: {
                            identifier: data.adminEmail,
                            token: verificationToken,
                            expires: verificationExpires,
                        },
                    });

                    // Send verification email
                    const verificationUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

                    const emailHtml = getVerificationEmailHtml({
                        userName: data.adminFirstName || data.adminEmail.split('@')[0],
                        verificationUrl,
                    });

                    const emailResult = await sendEmail({
                        to: [data.adminEmail],
                        subject: "Verify Your Email - SikshaMitra",
                        html: emailHtml,
                    });

                    if (!emailResult.success) {
                        console.error("Failed to send verification email:", emailResult.error);
                        // Don't fail setup if email fails, but log it
                    } else {
                        console.log("Verification email sent to:", data.adminEmail);
                    }
                } catch (emailError) {
                    console.error("Error sending verification email:", emailError);
                    // Don't fail setup if email sending fails
                }
            }

        } catch (error) {
            console.error("Error setting up admin user:", error);
            // Don't fail the whole setup if admin creation fails (logging/error reporting)
            return { success: false, error: "Failed to create/link admin user: " + (error as Error).message };
        }
    }

    try {
        // Break down into smaller transactions to avoid timeout
        console.log("Starting school setup process...");

        // 1. Create academic year first
        console.log("Creating academic year...");
        const academicYear = await db.academicYear.create({
            data: {
                schoolId,
                name: data.academicYearName,
                startDate: data.academicYearStart as Date,
                endDate: data.academicYearEnd as Date,
                isCurrent: true,
            },
        });
        console.log("Academic year created:", academicYear.id);

        // 2. Create terms
        console.log("Creating terms...");
        const createdTerms = [];
        for (const term of data.terms) {
            if (term.name && term.startDate && term.endDate) {
                const createdTerm = await db.term.create({
                    data: {
                        schoolId,
                        name: term.name,
                        academicYearId: academicYear.id,
                        startDate: term.startDate,
                        endDate: term.endDate,
                    },
                });
                createdTerms.push(createdTerm);
                console.log("Term created:", createdTerm.name);
            }
        }

        // 3. Create classes and sections in batches
        console.log("Creating classes and sections...");
        const classPromises = data.selectedClasses.map(async (className) => {
            const createdClass = await db.class.create({
                data: {
                    schoolId,
                    name: className,
                    academicYearId: academicYear.id,
                },
            });
            console.log("Class created:", createdClass.name);

            // Create sections for this class
            const sectionPromises = data.sections.map(sectionName =>
                db.classSection.create({
                    data: {
                        schoolId,
                        name: sectionName,
                        classId: createdClass.id,
                        capacity: 40, // Default capacity
                    },
                })
            );

            await Promise.all(sectionPromises);
            console.log(`Sections created for ${createdClass.name}: ${data.sections.join(', ')}`);

            return createdClass;
        });

        await Promise.all(classPromises);

        // 4. Create default grade scale and exam types in a single transaction
        console.log("Creating grade scales and exam types...");
        await db.$transaction(async (tx) => {
            // Grade scales
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

            const gradeScalePromises = gradeScales.map(scale =>
                tx.gradeScale.create({
                    data: {
                        schoolId,
                        ...scale
                    }
                })
            );

            // Exam types
            const examTypes = [
                { name: "Unit Test", description: "Regular unit assessment", weight: 10, isActive: true, includeInGradeCard: true },
                { name: "Mid-Term Exam", description: "Mid-term examination", weight: 30, isActive: true, includeInGradeCard: true },
                { name: "Final Exam", description: "Final examination", weight: 50, isActive: true, includeInGradeCard: true },
                { name: "Practical", description: "Practical examination", weight: 10, isActive: true, includeInGradeCard: true },
            ];

            const examTypePromises = examTypes.map(examType =>
                tx.examType.create({
                    data: {
                        schoolId,
                        ...examType
                    }
                })
            );

            await Promise.all([...gradeScalePromises, ...examTypePromises]);
        });
        console.log("Grade scales and exam types created");

        // 5. Mark school as onboarded
        console.log("Marking school as onboarded...");
        await db.school.update({
            where: { id: schoolId },
            data: {
                isOnboarded: true,
                onboardingStep: 7,
                onboardingCompletedAt: new Date(),
            },
        });
        console.log("School marked as onboarded");

        const result = {
            academicYear,
            termsCount: createdTerms.length,
            classesCount: data.selectedClasses.length,
        };

        console.log("Database operations completed successfully");

        // Update detailed progress tracking to mark all steps as completed
        try {
            console.log("Updating progress tracking...");
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
            console.log("Progress tracking updated");
        } catch (progressError) {
            console.warn("Failed to update detailed progress tracking:", progressError);
        }

        // Revalidate paths
        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/setup");
        revalidatePath(`/super-admin/schools/${schoolId}`);

        console.log("School setup completed successfully");
        return {
            success: true,
            data: {
                message: data.adminEmail
                    ? "School setup completed successfully. Please check your email to verify your account before logging in."
                    : "School setup completed successfully",
                academicYear: result.academicYear.name,
                requiresEmailVerification: !!data.adminEmail,
            },
        };
    } catch (error) {
        console.error("Error in completeSchoolSetup:", error);
        throw error;
    }
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
