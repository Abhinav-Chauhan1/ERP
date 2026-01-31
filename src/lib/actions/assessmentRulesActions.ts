"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils/permissions";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { AssessmentRuleFormValues, AssessmentRuleUpdateFormValues } from "../schemaValidation/assessmentRulesSchemaValidation";

async function checkPermission(action: "CREATE" | "UPDATE" | "DELETE" | "VIEW") {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Using SYSTEM_SETTINGS or ASSESSMENT as base permission
    const allowed = await hasPermission(userId, "ASSESSMENT", action as any);
    if (!allowed) throw new Error("Permission denied");
    return userId;
}

export async function getAssessmentRules() {
    try {
        await checkPermission("VIEW");
        const rules = await db.assessmentRule.findMany({
            include: {
                class: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: rules };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch rules" };
    }
}

export async function createAssessmentRule(data: AssessmentRuleFormValues) {
    try {
        await checkPermission("CREATE");
        const { schoolId } = await requireSchoolAccess();
        if (!schoolId) return { success: false, error: "School context required" };
        
        const rule = await db.assessmentRule.create({
            data: {
                name: data.name,
                classId: data.classId || undefined,
                subjectId: data.subjectId || undefined,
                ruleType: data.ruleType,
                examTypes: data.examTypes,
                count: data.count || undefined,
                weight: data.weight,
                schoolId,
            },
        });
        revalidatePath("/admin/assessment/assessment-rules");
        return { success: true, data: rule };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to create rule" };
    }
}

export async function updateAssessmentRule(data: AssessmentRuleUpdateFormValues) {
    try {
        await checkPermission("UPDATE");
        const rule = await db.assessmentRule.update({
            where: { id: data.id },
            data: {
                name: data.name,
                classId: data.classId,
                subjectId: data.subjectId,
                ruleType: data.ruleType,
                examTypes: data.examTypes,
                count: data.count,
                weight: data.weight,
            },
        });
        revalidatePath("/admin/assessment/assessment-rules");
        return { success: true, data: rule };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update rule" };
    }
}

export async function deleteAssessmentRule(id: string) {
    try {
        await checkPermission("DELETE");
        await db.assessmentRule.delete({ where: { id } });
        revalidatePath("/admin/assessment/assessment-rules");
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete rule" };
    }
}
