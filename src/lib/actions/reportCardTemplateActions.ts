"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";

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

    // Check if name already exists
    const existing = await db.reportCardTemplate.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      return {
        success: false,
        error: "A template with this name already exists",
      };
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await db.reportCardTemplate.updateMany({
        where: { isDefault: true },
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
        styling: input.styling as any,
        headerImage: input.headerImage,
        footerImage: input.footerImage,
        schoolLogo: input.schoolLogo,
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

    // If name is being changed, check for duplicates
    if (input.name && input.name !== existing.name) {
      const duplicate = await db.reportCardTemplate.findUnique({
        where: { name: input.name },
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

    // Generate unique name
    let newName = `${template.name} (Copy)`;
    let counter = 1;
    while (await db.reportCardTemplate.findUnique({ where: { name: newName } })) {
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
        isActive: false, // New duplicates start as inactive
        isDefault: false,
        createdBy: userId,
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
