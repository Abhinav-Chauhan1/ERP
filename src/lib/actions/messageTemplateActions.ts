"use server";

/**
 * Message Template Actions
 * 
 * Server actions for managing message templates for SMS, Email, and WhatsApp communications.
 * Supports template variables for dynamic content personalization.
 * 
 * Requirements: 11.1 - Message Template Management, 9.1-9.5 - WhatsApp Template Management
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { MessageType, WhatsAppTemplateStatus } from "@prisma/client";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export interface MessageTemplateInput {
  name: string;
  description?: string;
  type: MessageType;
  category?: string;
  subject?: string;
  body: string;
  variables: string[];
  isActive?: boolean;
  isDefault?: boolean;
  // WhatsApp fields
  whatsappTemplateName?: string;
  whatsappTemplateId?: string;
  whatsappLanguage?: string;
  whatsappStatus?: WhatsAppTemplateStatus;
  // SMS fields
  dltTemplateId?: string;
}

/**
 * Get all message templates
 */
export async function getMessageTemplates(filters?: {
  type?: MessageType;
  category?: string;
  isActive?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Build where clause
    const where: any = {};
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const templates = await db.messageTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Parse variables JSON
    const templatesWithParsedVariables = templates.map(template => ({
      ...template,
      variables: JSON.parse(template.variables),
    }));

    return {
      success: true,
      data: templatesWithParsedVariables,
    };
  } catch (error: any) {
    console.error("Error in getMessageTemplates:", error);
    return { success: false, error: error.message || "Failed to fetch templates" };
  }
}

/**
 * Get a single message template by ID
 */
export async function getMessageTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    return {
      success: true,
      data: {
        ...template,
        variables: JSON.parse(template.variables),
      },
    };
  } catch (error: any) {
    console.error("Error in getMessageTemplate:", error);
    return { success: false, error: error.message || "Failed to fetch template" };
  }
}

/**
 * Create a new message template
 */
export async function createMessageTemplate(data: MessageTemplateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Validate required fields
    if (!data.name || !data.body) {
      return { success: false, error: "Name and body are required" };
    }

    // For email templates, subject is required
    if ((data.type === "EMAIL" || data.type === "BOTH") && !data.subject) {
      return { success: false, error: "Subject is required for email templates" };
    }

    // For WhatsApp templates, template name is required
    if (data.type === "WHATSAPP" && !data.whatsappTemplateName) {
      return { success: false, error: "WhatsApp template name is required for WhatsApp templates" };
    }

    // Check if template name already exists for this school
    const existing = await db.messageTemplate.findUnique({
      where: { 
        schoolId_name: {
          schoolId: schoolId || "",
          name: data.name
        }
      },
    });

    if (existing) {
      return { success: false, error: "A template with this name already exists" };
    }

    // Create template
    const template = await db.messageTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        subject: data.subject,
        body: data.body,
        variables: JSON.stringify(data.variables || []),
        isActive: data.isActive ?? true,
        isDefault: false,
        createdBy: dbUser.id,
        whatsappTemplateName: data.whatsappTemplateName,
        whatsappTemplateId: data.whatsappTemplateId,
        whatsappLanguage: data.whatsappLanguage,
        whatsappStatus: data.whatsappStatus,
        dltTemplateId: data.dltTemplateId,
        schoolId: schoolId || "",
      },
    });

    revalidatePath("/admin/communication/templates");

    return {
      success: true,
      data: {
        ...template,
        variables: JSON.parse(template.variables),
      },
    };
  } catch (error: any) {
    console.error("Error in createMessageTemplate:", error);
    return { success: false, error: error.message || "Failed to create template" };
  }
}

/**
 * Update a message template
 */
export async function updateMessageTemplate(id: string, data: Partial<MessageTemplateInput>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Check if template exists
    const existing = await db.messageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Template not found" };
    }

    // Prevent updating default templates
    if (existing.isDefault) {
      return { success: false, error: "Cannot update default system templates" };
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await db.messageTemplate.findUnique({
        where: { 
          schoolId_name: {
            schoolId: schoolId || "",
            name: data.name
          }
        },
      });

      if (duplicate) {
        return { success: false, error: "A template with this name already exists" };
      }
    }

    // Validate email templates have subject
    const newType = data.type || existing.type;
    const newSubject = data.subject !== undefined ? data.subject : existing.subject;
    if ((newType === "EMAIL" || newType === "BOTH") && !newSubject) {
      return { success: false, error: "Subject is required for email templates" };
    }

    // Validate WhatsApp templates have template name
    const newWhatsappTemplateName = data.whatsappTemplateName !== undefined ? data.whatsappTemplateName : existing.whatsappTemplateName;
    if (newType === "WHATSAPP" && !newWhatsappTemplateName) {
      return { success: false, error: "WhatsApp template name is required for WhatsApp templates" };
    }

    // Update template
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    // WhatsApp fields
    if (data.whatsappTemplateName !== undefined) updateData.whatsappTemplateName = data.whatsappTemplateName;
    if (data.whatsappTemplateId !== undefined) updateData.whatsappTemplateId = data.whatsappTemplateId;
    if (data.whatsappLanguage !== undefined) updateData.whatsappLanguage = data.whatsappLanguage;
    if (data.whatsappStatus !== undefined) updateData.whatsappStatus = data.whatsappStatus;
    // SMS fields
    if (data.dltTemplateId !== undefined) updateData.dltTemplateId = data.dltTemplateId;

    const template = await db.messageTemplate.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/communication/templates");

    return {
      success: true,
      data: {
        ...template,
        variables: JSON.parse(template.variables),
      },
    };
  } catch (error: any) {
    console.error("Error in updateMessageTemplate:", error);
    return { success: false, error: error.message || "Failed to update template" };
  }
}

/**
 * Delete a message template
 */
export async function deleteMessageTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if template exists
    const existing = await db.messageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Template not found" };
    }

    // Prevent deleting default templates
    if (existing.isDefault) {
      return { success: false, error: "Cannot delete default system templates" };
    }

    // Delete template
    await db.messageTemplate.delete({
      where: { id },
    });

    revalidatePath("/admin/communication/templates");

    return {
      success: true,
      message: "Template deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteMessageTemplate:", error);
    return { success: false, error: error.message || "Failed to delete template" };
  }
}

/**
 * Render a template with provided variables
 */
export async function renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
  let rendered = template;
  
  // Replace all variables in the format {{variableName}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(variables[key] || ''));
  });
  
  return rendered;
}

/**
 * Get available template variables
 */
export async function getAvailableTemplateVariables() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Define available variables for different contexts
    const variables = {
      student: [
        { name: 'studentName', description: 'Student full name' },
        { name: 'studentFirstName', description: 'Student first name' },
        { name: 'studentLastName', description: 'Student last name' },
        { name: 'admissionId', description: 'Student admission ID' },
        { name: 'rollNumber', description: 'Student roll number' },
        { name: 'className', description: 'Student class name' },
        { name: 'sectionName', description: 'Student section name' },
      ],
      parent: [
        { name: 'parentName', description: 'Parent full name' },
        { name: 'parentFirstName', description: 'Parent first name' },
        { name: 'parentLastName', description: 'Parent last name' },
        { name: 'parentEmail', description: 'Parent email address' },
        { name: 'parentPhone', description: 'Parent phone number' },
      ],
      teacher: [
        { name: 'teacherName', description: 'Teacher full name' },
        { name: 'teacherFirstName', description: 'Teacher first name' },
        { name: 'teacherLastName', description: 'Teacher last name' },
        { name: 'employeeId', description: 'Teacher employee ID' },
      ],
      school: [
        { name: 'schoolName', description: 'School name' },
        { name: 'schoolAddress', description: 'School address' },
        { name: 'schoolPhone', description: 'School phone number' },
        { name: 'schoolEmail', description: 'School email address' },
        { name: 'schoolWebsite', description: 'School website URL' },
      ],
      general: [
        { name: 'date', description: 'Current date' },
        { name: 'time', description: 'Current time' },
        { name: 'academicYear', description: 'Current academic year' },
        { name: 'term', description: 'Current term' },
      ],
      fees: [
        { name: 'feeAmount', description: 'Fee amount' },
        { name: 'dueDate', description: 'Fee due date' },
        { name: 'balance', description: 'Outstanding balance' },
        { name: 'receiptNumber', description: 'Payment receipt number' },
      ],
      attendance: [
        { name: 'attendanceDate', description: 'Attendance date' },
        { name: 'attendanceStatus', description: 'Attendance status (Present/Absent)' },
        { name: 'attendancePercentage', description: 'Attendance percentage' },
      ],
      exam: [
        { name: 'examName', description: 'Exam name' },
        { name: 'examDate', description: 'Exam date' },
        { name: 'examTime', description: 'Exam time' },
        { name: 'subject', description: 'Subject name' },
        { name: 'marks', description: 'Marks obtained' },
        { name: 'totalMarks', description: 'Total marks' },
        { name: 'grade', description: 'Grade obtained' },
      ],
    };

    return {
      success: true,
      data: variables,
    };
  } catch (error: any) {
    console.error("Error in getAvailableTemplateVariables:", error);
    return { success: false, error: error.message || "Failed to fetch variables" };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateMessageTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Get original template
    const original = await db.messageTemplate.findUnique({
      where: { id },
    });

    if (!original) {
      return { success: false, error: "Template not found" };
    }

    // Create duplicate with modified name
    let newName = `${original.name} (Copy)`;
    let counter = 1;
    
    // Ensure unique name for this school
    while (await db.messageTemplate.findUnique({ 
      where: { 
        schoolId_name: {
          schoolId: schoolId || "",
          name: newName
        }
      } 
    })) {
      counter++;
      newName = `${original.name} (Copy ${counter})`;
    }

    const duplicate = await db.messageTemplate.create({
      data: {
        name: newName,
        description: original.description,
        type: original.type,
        category: original.category,
        subject: original.subject,
        body: original.body,
        variables: original.variables,
        isActive: original.isActive,
        isDefault: false, // Duplicates are never default
        createdBy: dbUser.id,
        whatsappTemplateName: original.whatsappTemplateName,
        whatsappLanguage: original.whatsappLanguage,
        dltTemplateId: original.dltTemplateId,
        schoolId: schoolId || "",
      },
    });

    revalidatePath("/admin/communication/templates");

    return {
      success: true,
      data: {
        ...duplicate,
        variables: JSON.parse(duplicate.variables),
      },
    };
  } catch (error: any) {
    console.error("Error in duplicateMessageTemplate:", error);
    return { success: false, error: error.message || "Failed to duplicate template" };
  }
}
