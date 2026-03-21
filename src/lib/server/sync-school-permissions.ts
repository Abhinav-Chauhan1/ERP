import { db } from '@/lib/db'
import { PLAN_FEATURES, PlanType, FeatureKey } from '@/lib/config/plan-features'

/**
 * Maps plan FeatureKey → SchoolPermissions column name.
 * Only plan-gated columns are listed here.
 * Columns not in this map are always-true and are never touched by plan sync.
 */
const FEATURE_TO_PERMISSION: Partial<Record<FeatureKey, string>> = {
  library:        'libraryManagement',
  transport:      'transportManagement',
  hostel:         'hostelManagement',
  alumni:         'alumniManagement',
  certificates:   'certificateGeneration',
  whatsapp:       'whatsappIntegration',
  bulk_messaging: 'smsIntegration',
}

/**
 * Updates SchoolPermissions to reflect the school's current plan.
 *
 * Rule: plan-features.ts is the authoritative source for what a plan CAN access.
 * SchoolPermissions is a super-admin override layer that can only RESTRICT,
 * never GRANT beyond what the plan allows.
 *
 * This function sets plan-gated permissions to true/false based on the plan.
 * It does NOT touch always-true permissions (manageStudents, feeManagement, etc.).
 *
 * A super-admin can still manually turn off a feature for a specific school
 * even if the plan includes it — that manual override is preserved on subsequent
 * plan syncs only if the plan no longer includes the feature (it will be set false).
 * If the plan includes the feature, this sync sets it to true (enabling it).
 */
export async function syncSchoolPermissions(
  schoolId: string,
  plan: PlanType
): Promise<void> {
  const planFeatures = PLAN_FEATURES[plan]

  const updates: Record<string, boolean> = {}
  for (const [feature, permKey] of Object.entries(FEATURE_TO_PERMISSION)) {
    updates[permKey] = planFeatures.includes(feature as FeatureKey)
  }

  await db.schoolPermissions.upsert({
    where: { schoolId },
    update: updates,
    create: {
      schoolId,
      // Always-true permissions (not plan-gated):
      manageStudents: true,
      manageTeachers: true,
      manageParents: true,
      manageAdmins: true,
      manageClasses: true,
      manageSubjects: true,
      manageSyllabus: true,
      manageExams: true,
      manageAssignments: true,
      manageAttendance: true,
      generateReportCards: true,
      messagingSystem: true,
      notificationSystem: true,
      announcementSystem: true,
      emailIntegration: true,
      feeManagement: true,
      paymentProcessing: true,
      financialReports: true,
      backupRestore: true,
      dataExport: true,
      auditLogs: true,
      customBranding: true,
      apiAccess: false,
      // Plan-gated permissions:
      ...updates,
    },
  })
}
