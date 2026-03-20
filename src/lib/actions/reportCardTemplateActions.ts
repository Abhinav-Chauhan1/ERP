"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export interface SignatoryConfig {
  label: string;
  image?: string;
  position: 'left' | 'center' | 'right';
  name?: string;
}

export interface GradingConfig {
  system: '5_POINT' | '7_POINT' | 'MARKS_ONLY' | 'CGPA';
  showMarks: boolean;
  showGrade: boolean;
}

export interface ReportCardTemplateInput {
  name: string;
  description?: string;
  type: "CBSE" | "STATE_BOARD" | "CUSTOM";
  pageSize?: string;
  orientation?: string;
  sections: TemplateSectionConfig[];
  styling: TemplateStyles;
  headerImage?: string;
  footerImage?: string;
  schoolLogo?: string;
  signatures?: SignatoryConfig[];
  disclaimer?: string;
  gradingConfig?: GradingConfig;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TemplateSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  fields: string[];
}

export interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  headerHeight: number;
  footerHeight: number;

  // Advanced styling
  tableHeaderBg?: string; // Background for table headers
  tableHeaderText?: string; // Text color for table headers
  tableBorderColor?: string; // Color for table borders
  sectionTitleColor?: string; // Color for section titles
  textColor?: string; // General text color
  alternateRowColor?: string; // Background for alternate rows

  // Layout options
  headerStyle?: 'classic' | 'modern' | 'minimal';
  studentInfoStyle?: 'list' | 'grid' | 'boxed';
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all report card templates
 */
export async function getReportCardTemplates(): Promise<ActionResult> {
  try {
    const templates = await db.reportCardTemplate.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching report card templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report card templates",
    };
  }
}

/**
 * Get a single report card template by ID
 */
export async function getReportCardTemplate(id: string): Promise<ActionResult> {
  try {
    const template = await db.reportCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    return { success: true, data: template };
  } catch (error) {
    console.error("Error fetching report card template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report card template",
    };
  }
}

/**
 * Create a new report card template
 */
export async function createReportCardTemplate(input: ReportCardTemplateInput): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate required fields
    if (!input.name || !input.type) {
      return {
        success: false,
        error: "Name and type are required fields",
      };
    }

    // Validate sections
    if (!input.sections || input.sections.length === 0) {
      return {
        success: false,
        error: "At least one section must be configured",
      };
    }

    // Validate styling
    if (!input.styling || !input.styling.primaryColor || !input.styling.fontFamily) {
      return {
        success: false,
        error: "Styling configuration is incomplete",
      };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Check if name already exists for this school
    const existing = await db.reportCardTemplate.findUnique({
      where: { 
        schoolId_name: {
          schoolId: schoolId,
          name: input.name
        }
      },
    });

    if (existing) {
      return {
        success: false,
        error: "A template with this name already exists",
      };
    }

    // If this is set as default, unset other defaults for this school
    if (input.isDefault) {
      await db.reportCardTemplate.updateMany({
        where: { 
          isDefault: true,
          schoolId: schoolId
        },
        data: { isDefault: false },
      });
    }

    const template = await db.reportCardTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        pageSize: input.pageSize || "A4",
        orientation: input.orientation || "PORTRAIT",
        sections: input.sections as any,
        school: { connect: { id: schoolId } }, // Add required school connection
        styling: input.styling as any,
        headerImage: input.headerImage,
        footerImage: input.footerImage,
        schoolLogo: input.schoolLogo,
        signatures: input.signatures ? (input.signatures as any) : undefined,
        disclaimer: input.disclaimer,
        gradingConfig: input.gradingConfig ? (input.gradingConfig as any) : undefined,
        isActive: input.isActive ?? true,
        isDefault: input.isDefault ?? false,
        createdBy: userId,
      },
    });

    revalidatePath("/admin/assessment/report-cards/templates");

    return { success: true, data: template };
  } catch (error) {
    console.error("Error creating report card template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create report card template",
    };
  }
}

/**
 * Update an existing report card template
 */
export async function updateReportCardTemplate(
  id: string,
  input: Partial<ReportCardTemplateInput>
): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if template exists
    const existing = await db.reportCardTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Template not found" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // If name is being changed, check for duplicates within the school
    if (input.name && input.name !== existing.name) {
      const duplicate = await db.reportCardTemplate.findUnique({
        where: { 
          schoolId_name: {
            schoolId: schoolId,
            name: input.name
          }
        },
      });

      if (duplicate) {
        return {
          success: false,
          error: "A template with this name already exists",
        };
      }
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await db.reportCardTemplate.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.pageSize !== undefined) updateData.pageSize = input.pageSize;
    if (input.orientation !== undefined) updateData.orientation = input.orientation;
    if (input.sections !== undefined) updateData.sections = input.sections;
    if (input.styling !== undefined) updateData.styling = input.styling;
    if (input.headerImage !== undefined) updateData.headerImage = input.headerImage;
    if (input.footerImage !== undefined) updateData.footerImage = input.footerImage;
    if (input.schoolLogo !== undefined) updateData.schoolLogo = input.schoolLogo;
    if (input.signatures !== undefined) updateData.signatures = input.signatures;
    if (input.disclaimer !== undefined) updateData.disclaimer = input.disclaimer;
    if (input.gradingConfig !== undefined) updateData.gradingConfig = input.gradingConfig;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    const template = await db.reportCardTemplate.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/assessment/report-cards/templates");
    revalidatePath(`/admin/assessment/report-cards/templates/${id}`);

    return { success: true, data: template };
  } catch (error) {
    console.error("Error updating report card template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update report card template",
    };
  }
}

/**
 * Delete a report card template
 */
export async function deleteReportCardTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if template exists
    const template = await db.reportCardTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reportCards: true },
        },
      },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Prevent deletion if template is in use
    if (template._count.reportCards > 0) {
      return {
        success: false,
        error: `Cannot delete template. It is being used by ${template._count.reportCards} report card(s)`,
      };
    }

    // Prevent deletion of default template
    if (template.isDefault) {
      return {
        success: false,
        error: "Cannot delete the default template. Set another template as default first",
      };
    }

    await db.reportCardTemplate.delete({
      where: { id },
    });

    revalidatePath("/admin/assessment/report-cards/templates");

    return { success: true };
  } catch (error) {
    console.error("Error deleting report card template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete report card template",
    };
  }
}

/**
 * Set a template as default
 */
export async function setDefaultTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if template exists
    const template = await db.reportCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Unset all other defaults
    await db.reportCardTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this template as default
    await db.reportCardTemplate.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/admin/assessment/report-cards/templates");

    return { success: true };
  } catch (error) {
    console.error("Error setting default template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default template",
    };
  }
}

/**
 * Toggle template active status
 */
export async function toggleTemplateActive(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.reportCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const updated = await db.reportCardTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });

    revalidatePath("/admin/assessment/report-cards/templates");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling template active status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle template status",
    };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.reportCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Generate unique name within the school
    let newName = `${template.name} (Copy)`;
    let counter = 1;
    while (await db.reportCardTemplate.findUnique({ 
      where: { 
        schoolId_name: {
          schoolId: schoolId,
          name: newName
        }
      } 
    })) {
      newName = `${template.name} (Copy ${counter})`;
      counter++;
    }

    const duplicate = await db.reportCardTemplate.create({
      data: {
        name: newName,
        description: template.description,
        type: template.type,
        pageSize: template.pageSize,
        orientation: template.orientation,
        sections: template.sections as any,
        styling: template.styling as any,
        headerImage: template.headerImage,
        footerImage: template.footerImage,
        schoolLogo: template.schoolLogo,
        signatures: template.signatures as any,
        disclaimer: template.disclaimer,
        gradingConfig: template.gradingConfig as any,
        isActive: false, // New duplicates start as inactive
        isDefault: false,
        createdBy: userId,
        school: { connect: { id: schoolId } }, // Add required school connection
      },
    });

    revalidatePath("/admin/assessment/report-cards/templates");

    return { success: true, data: duplicate };
  } catch (error) {
    console.error("Error duplicating template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to duplicate template",
    };
  }
}

/**
 * Get only pre-built templates for the current school
 */
export async function getPreBuiltTemplates(): Promise<ActionResult> {
  try {
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const templates = await db.reportCardTemplate.findMany({
      where: { schoolId, isPreBuilt: true, isActive: true },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching pre-built templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch pre-built templates",
    };
  }
}

/**
 * Assign a pre-built template to a class (sets reportCardTemplateId on Class)
 */
export async function assignTemplateToClass(
  templateId: string,
  classId: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Verify template belongs to this school
    const template = await db.reportCardTemplate.findFirst({
      where: { id: templateId, schoolId },
    });
    if (!template) return { success: false, error: "Template not found" };

    // Verify class belongs to this school
    const cls = await db.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) return { success: false, error: "Class not found" };

    await db.class.update({
      where: { id: classId },
      data: { reportCardTemplateId: templateId },
    });

    revalidatePath("/admin/assessment/report-cards/templates");
    return { success: true };
  } catch (error) {
    console.error("Error assigning template to class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign template",
    };
  }
}

/**
 * Seed pre-built CBSE templates for a school (idempotent).
 * Call this during school onboarding or from a setup script.
 */
export async function seedPreBuiltTemplates(schoolId: string, createdBy: string): Promise<ActionResult> {
  const defaultSections = [
    { id: "student-info", name: "Student Information", enabled: true, order: 1, fields: [] },
    { id: "scholastic", name: "Scholastic Subjects", enabled: true, order: 2, fields: [] },
    { id: "co-scholastic", name: "Co-Scholastic", enabled: true, order: 3, fields: [] },
    { id: "remarks", name: "Remarks", enabled: true, order: 4, fields: [] },
  ];
  const defaultStyling = {
    primaryColor: "#C0392B",
    secondaryColor: "#1a3a6b",
    fontFamily: "helvetica",
    fontSize: 8,
    headerHeight: 30,
    footerHeight: 20,
  };

  const templates = [
    {
      name: "CBSE Primary (Class 1–8)",
      description: "PT/MA/Portfolio/HY two-term layout with co-scholastic sections",
      cbseLevel: "CBSE_PRIMARY",
    },
    {
      name: "CBSE Secondary (Class 9–10)",
      description: "Theory + Practical/Internal annual layout, 33% pass mark",
      cbseLevel: "CBSE_SECONDARY",
    },
    {
      name: "CBSE Senior Secondary (Class 11–12)",
      description: "Theory (70/80) + Practical (30/20) annual layout",
      cbseLevel: "CBSE_SENIOR",
    },
  ];

  try {
    for (const t of templates) {
      await db.reportCardTemplate.upsert({
        where: { schoolId_name: { schoolId, name: t.name } },
        create: {
          schoolId,
          name: t.name,
          description: t.description,
          type: "CBSE",
          cbseLevel: t.cbseLevel,
          isPreBuilt: true,
          isActive: true,
          isDefault: t.cbseLevel === "CBSE_PRIMARY",
          sections: defaultSections as any,
          styling: defaultStyling as any,
          createdBy,
        },
        update: {
          cbseLevel: t.cbseLevel,
          isPreBuilt: true,
          isActive: true,
        },
      });
    }

    revalidatePath("/admin/assessment/report-cards/templates");
    return { success: true };
  } catch (error) {
    console.error("Error seeding pre-built templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to seed templates",
    };
  }
}
