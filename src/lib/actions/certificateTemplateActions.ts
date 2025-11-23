"use server";

/**
 * Certificate Template Actions
 * 
 * Server actions for managing certificate templates for generating certificates and ID cards.
 * Supports custom layouts, styling, and merge fields for dynamic content personalization.
 * 
 * Requirements: 12.1 - Certificate Template Management
 */

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { CertificateType, CertificateStatus } from "@prisma/client";

export interface CertificateTemplateInput {
  name: string;
  description?: string;
  type: CertificateType;
  category?: string;
  layout: Record<string, any>;
  styling: Record<string, any>;
  content: string;
  mergeFields: string[];
  pageSize?: string;
  orientation?: string;
  headerImage?: string;
  footerImage?: string;
  background?: string;
  signature1?: string;
  signature2?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * Get all certificate templates
 */
export async function getCertificateTemplates(filters?: {
  type?: CertificateType;
  category?: string;
  isActive?: boolean;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
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

    const templates = await db.certificateTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Parse JSON fields
    const templatesWithParsedData = templates.map(template => ({
      ...template,
      layout: JSON.parse(template.layout),
      styling: JSON.parse(template.styling),
      mergeFields: JSON.parse(template.mergeFields),
    }));

    return {
      success: true,
      data: templatesWithParsedData,
    };
  } catch (error: any) {
    console.error("Error in getCertificateTemplates:", error);
    return { success: false, error: error.message || "Failed to fetch templates" };
  }
}

/**
 * Get a single certificate template by ID
 */
export async function getCertificateTemplate(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.certificateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    return {
      success: true,
      data: {
        ...template,
        layout: JSON.parse(template.layout),
        styling: JSON.parse(template.styling),
        mergeFields: JSON.parse(template.mergeFields),
      },
    };
  } catch (error: any) {
    console.error("Error in getCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to fetch template" };
  }
}

/**
 * Create a new certificate template
 */
export async function createCertificateTemplate(data: CertificateTemplateInput) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate required fields
    if (!data.name || !data.content) {
      return { success: false, error: "Name and content are required" };
    }

    // Check if template name already exists
    const existing = await db.certificateTemplate.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return { success: false, error: "A template with this name already exists" };
    }

    // Create template
    const template = await db.certificateTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        layout: JSON.stringify(data.layout || {}),
        styling: JSON.stringify(data.styling || {}),
        content: data.content,
        mergeFields: JSON.stringify(data.mergeFields || []),
        pageSize: data.pageSize || "A4",
        orientation: data.orientation || "LANDSCAPE",
        headerImage: data.headerImage,
        footerImage: data.footerImage,
        background: data.background,
        signature1: data.signature1,
        signature2: data.signature2,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        createdBy: dbUser.id,
      },
    });

    revalidatePath("/admin/certificates/templates");

    return {
      success: true,
      data: {
        ...template,
        layout: JSON.parse(template.layout),
        styling: JSON.parse(template.styling),
        mergeFields: JSON.parse(template.mergeFields),
      },
    };
  } catch (error: any) {
    console.error("Error in createCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to create template" };
  }
}

/**
 * Update a certificate template
 */
export async function updateCertificateTemplate(id: string, data: Partial<CertificateTemplateInput>) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if template exists
    const existing = await db.certificateTemplate.findUnique({
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
      const duplicate = await db.certificateTemplate.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        return { success: false, error: "A template with this name already exists" };
      }
    }

    // Update template
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.layout !== undefined) updateData.layout = JSON.stringify(data.layout);
    if (data.styling !== undefined) updateData.styling = JSON.stringify(data.styling);
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mergeFields !== undefined) updateData.mergeFields = JSON.stringify(data.mergeFields);
    if (data.pageSize !== undefined) updateData.pageSize = data.pageSize;
    if (data.orientation !== undefined) updateData.orientation = data.orientation;
    if (data.headerImage !== undefined) updateData.headerImage = data.headerImage;
    if (data.footerImage !== undefined) updateData.footerImage = data.footerImage;
    if (data.background !== undefined) updateData.background = data.background;
    if (data.signature1 !== undefined) updateData.signature1 = data.signature1;
    if (data.signature2 !== undefined) updateData.signature2 = data.signature2;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const template = await db.certificateTemplate.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/certificates/templates");

    return {
      success: true,
      data: {
        ...template,
        layout: JSON.parse(template.layout),
        styling: JSON.parse(template.styling),
        mergeFields: JSON.parse(template.mergeFields),
      },
    };
  } catch (error: any) {
    console.error("Error in updateCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to update template" };
  }
}

/**
 * Delete a certificate template
 */
export async function deleteCertificateTemplate(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if template exists
    const existing = await db.certificateTemplate.findUnique({
      where: { id },
      include: {
        certificates: {
          take: 1,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Template not found" };
    }

    // Prevent deleting default templates
    if (existing.isDefault) {
      return { success: false, error: "Cannot delete default system templates" };
    }

    // Prevent deleting templates with generated certificates
    if (existing.certificates.length > 0) {
      return { success: false, error: "Cannot delete template with existing certificates. Deactivate it instead." };
    }

    // Delete template
    await db.certificateTemplate.delete({
      where: { id },
    });

    revalidatePath("/admin/certificates/templates");

    return {
      success: true,
      message: "Template deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to delete template" };
  }
}

/**
 * Render a certificate template with provided variables
 */
export async function renderCertificateTemplate(template: string, variables: Record<string, any>): Promise<string> {
  let rendered = template;
  
  // Replace all variables in the format {{variableName}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(variables[key] || ''));
  });
  
  return rendered;
}

/**
 * Get available certificate merge fields
 */
export async function getAvailableCertificateMergeFields() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Define available merge fields for different contexts
    const mergeFields = {
      student: [
        { name: 'studentName', description: 'Student full name' },
        { name: 'studentFirstName', description: 'Student first name' },
        { name: 'studentLastName', description: 'Student last name' },
        { name: 'admissionId', description: 'Student admission ID' },
        { name: 'rollNumber', description: 'Student roll number' },
        { name: 'className', description: 'Student class name' },
        { name: 'sectionName', description: 'Student section name' },
        { name: 'dateOfBirth', description: 'Student date of birth' },
        { name: 'gender', description: 'Student gender' },
      ],
      academic: [
        { name: 'courseName', description: 'Course/Subject name' },
        { name: 'grade', description: 'Grade obtained' },
        { name: 'percentage', description: 'Percentage obtained' },
        { name: 'rank', description: 'Rank in class' },
        { name: 'academicYear', description: 'Academic year' },
        { name: 'term', description: 'Term/Semester' },
        { name: 'completionDate', description: 'Course completion date' },
      ],
      achievement: [
        { name: 'achievementTitle', description: 'Achievement title' },
        { name: 'achievementDescription', description: 'Achievement description' },
        { name: 'eventName', description: 'Event name' },
        { name: 'eventDate', description: 'Event date' },
        { name: 'position', description: 'Position/Rank achieved' },
        { name: 'category', description: 'Achievement category' },
      ],
      school: [
        { name: 'schoolName', description: 'School name' },
        { name: 'schoolAddress', description: 'School address' },
        { name: 'schoolPhone', description: 'School phone number' },
        { name: 'schoolEmail', description: 'School email address' },
        { name: 'schoolWebsite', description: 'School website URL' },
        { name: 'principalName', description: 'Principal name' },
        { name: 'principalSignature', description: 'Principal signature' },
      ],
      certificate: [
        { name: 'certificateNumber', description: 'Unique certificate number' },
        { name: 'issueDate', description: 'Certificate issue date' },
        { name: 'validUntil', description: 'Certificate validity date' },
        { name: 'verificationCode', description: 'QR/Barcode verification code' },
      ],
      general: [
        { name: 'date', description: 'Current date' },
        { name: 'time', description: 'Current time' },
        { name: 'year', description: 'Current year' },
      ],
    };

    return {
      success: true,
      data: mergeFields,
    };
  } catch (error: any) {
    console.error("Error in getAvailableCertificateMergeFields:", error);
    return { success: false, error: error.message || "Failed to fetch merge fields" };
  }
}

/**
 * Duplicate a certificate template
 */
export async function duplicateCertificateTemplate(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get original template
    const original = await db.certificateTemplate.findUnique({
      where: { id },
    });

    if (!original) {
      return { success: false, error: "Template not found" };
    }

    // Create duplicate with modified name
    let newName = `${original.name} (Copy)`;
    let counter = 1;
    
    // Ensure unique name
    while (await db.certificateTemplate.findUnique({ where: { name: newName } })) {
      counter++;
      newName = `${original.name} (Copy ${counter})`;
    }

    const duplicate = await db.certificateTemplate.create({
      data: {
        name: newName,
        description: original.description,
        type: original.type,
        category: original.category,
        layout: original.layout,
        styling: original.styling,
        content: original.content,
        mergeFields: original.mergeFields,
        pageSize: original.pageSize,
        orientation: original.orientation,
        headerImage: original.headerImage,
        footerImage: original.footerImage,
        background: original.background,
        signature1: original.signature1,
        signature2: original.signature2,
        isActive: original.isActive,
        isDefault: false, // Duplicates are never default
        createdBy: dbUser.id,
      },
    });

    revalidatePath("/admin/certificates/templates");

    return {
      success: true,
      data: {
        ...duplicate,
        layout: JSON.parse(duplicate.layout),
        styling: JSON.parse(duplicate.styling),
        mergeFields: JSON.parse(duplicate.mergeFields),
      },
    };
  } catch (error: any) {
    console.error("Error in duplicateCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to duplicate template" };
  }
}

/**
 * Get certificate template statistics
 */
export async function getCertificateTemplateStats(templateId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get template with certificate count
    const template = await db.certificateTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            certificates: true,
          },
        },
      },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Get certificate status breakdown
    const statusBreakdown = await db.generatedCertificate.groupBy({
      by: ['status'],
      where: {
        templateId: templateId,
      },
      _count: true,
    });

    const stats = {
      totalCertificates: template._count.certificates,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error("Error in getCertificateTemplateStats:", error);
    return { success: false, error: error.message || "Failed to fetch template statistics" };
  }
}

/**
 * Preview a certificate template with sample data
 */
export async function previewCertificateTemplate(templateId: string, sampleData?: Record<string, any>) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Use provided sample data or generate default sample data
    const defaultSampleData = {
      studentName: "John Doe",
      studentFirstName: "John",
      studentLastName: "Doe",
      admissionId: "2024001",
      rollNumber: "10-A-01",
      className: "Grade 10",
      sectionName: "Section A",
      courseName: "Mathematics",
      grade: "A+",
      percentage: "95%",
      rank: "1st",
      academicYear: "2024-2025",
      achievementTitle: "Excellence in Mathematics",
      schoolName: "Sample School",
      principalName: "Dr. Jane Smith",
      certificateNumber: "CERT-2024-001",
      issueDate: new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      year: new Date().getFullYear().toString(),
    };

    const data = sampleData || defaultSampleData;
    const renderedContent = renderCertificateTemplate(template.content, data);

    return {
      success: true,
      data: {
        ...template,
        layout: JSON.parse(template.layout),
        styling: JSON.parse(template.styling),
        mergeFields: JSON.parse(template.mergeFields),
        renderedContent,
      },
    };
  } catch (error: any) {
    console.error("Error in previewCertificateTemplate:", error);
    return { success: false, error: error.message || "Failed to preview template" };
  }
}
