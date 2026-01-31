/**
 * Notification Template Service
 * 
 * This service provides methods for retrieving and rendering notification templates
 * for promotion, graduation, and alumni management features.
 */

import { db } from "@/lib/db";
import { MessageType } from "@prisma/client";
import {
  renderMessageTemplate,
  preparePromotionVariables,
  prepareGraduationVariables,
  prepareAlumniWelcomeVariables,
  prepareAlumniEventVariables,
  prepareAlumniProfileUpdateVariables,
  validateTemplateVariables,
} from "@/lib/utils/templateUtils";

export class NotificationTemplateService {
  /**
   * Get a template by name and schoolId
   */
  async getTemplateByName(name: string, schoolId: string) {
    return await db.messageTemplate.findUnique({
      where: { 
        schoolId_name: {
          schoolId,
          name
        }
      },
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string) {
    return await db.messageTemplate.findMany({
      where: { category, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Render promotion notification
   */
  async renderPromotionNotification(data: {
    schoolId: string;
    parentName: string;
    studentName: string;
    sourceClass: string;
    sourceSection?: string;
    targetClass: string;
    targetSection?: string;
    targetAcademicYear: string;
    rollNumber?: string;
    sessionStartDate: Date;
    schoolName: string;
    schoolPhone: string;
  }) {
    const template = await this.getTemplateByName("Student Promotion Notification");

    if (!template) {
      throw new Error("Promotion notification template not found");
    }

    const variables = preparePromotionVariables(data);

    // Validate required variables
    const templateVariables = JSON.parse(template.variables);
    const validation = validateTemplateVariables(templateVariables, variables);

    if (!validation.valid) {
      console.warn(
        `Missing template variables: ${validation.missing.join(", ")}`
      );
    }

    return renderMessageTemplate(template, variables);
  }

  /**
   * Render graduation ceremony notification
   */
  async renderGraduationCeremonyNotification(data: {
    parentName?: string;
    studentName: string;
    ceremonyDate: Date;
    ceremonyTime: string;
    ceremonyVenue: string;
    chiefGuest?: string;
    finalClass: string;
    finalSection?: string;
    graduationDate: Date;
    schoolName: string;
    schoolPhone: string;
    schoolEmail: string;
  }) {
    const template = await this.getTemplateByName("Graduation Ceremony Notification");

    if (!template) {
      throw new Error("Graduation ceremony notification template not found");
    }

    const variables = prepareGraduationVariables(data);

    return renderMessageTemplate(template, variables);
  }

  /**
   * Render graduation congratulations message
   */
  async renderGraduationCongratulations(data: {
    studentName: string;
    finalClass: string;
    finalSection?: string;
    graduationDate: Date;
    academicYear?: string;
    schoolName: string;
    schoolPhone: string;
    schoolEmail: string;
  }) {
    const template = await this.getTemplateByName("Graduation Congratulations");

    if (!template) {
      throw new Error("Graduation congratulations template not found");
    }

    const variables = prepareGraduationVariables({
      ...data,
      ceremonyDate: data.graduationDate,
      ceremonyTime: "",
      ceremonyVenue: "",
    });

    return renderMessageTemplate(template, variables);
  }

  /**
   * Render alumni welcome message
   */
  async renderAlumniWelcomeMessage(data: {
    alumniName: string;
    graduationYear: number;
    finalClass: string;
    admissionId: string;
    portalUrl: string;
    schoolName: string;
    schoolPhone: string;
    schoolEmail: string;
  }) {
    const template = await this.getTemplateByName("Alumni Welcome Message");

    if (!template) {
      throw new Error("Alumni welcome message template not found");
    }

    const variables = prepareAlumniWelcomeVariables(data);

    return renderMessageTemplate(template, variables);
  }

  /**
   * Render alumni event invitation
   */
  async renderAlumniEventInvitation(data: {
    alumniName: string;
    eventName: string;
    eventDate: Date;
    eventTime: string;
    eventVenue: string;
    eventDescription: string;
    rsvpDeadline: Date;
    rsvpLink: string;
    contactPerson: string;
    contactPhone: string;
    schoolName: string;
    schoolPhone: string;
    schoolEmail: string;
  }) {
    const template = await this.getTemplateByName("Alumni Event Invitation");

    if (!template) {
      throw new Error("Alumni event invitation template not found");
    }

    const variables = prepareAlumniEventVariables(data);

    return renderMessageTemplate(template, variables);
  }

  /**
   * Render alumni profile update reminder
   */
  async renderAlumniProfileUpdateReminder(data: {
    alumniName: string;
    lastUpdated: Date;
    graduationYear: number;
    currentOccupation?: string;
    profileUrl: string;
    schoolName: string;
    schoolEmail: string;
  }) {
    const template = await this.getTemplateByName("Alumni Profile Update Reminder");

    if (!template) {
      throw new Error("Alumni profile update reminder template not found");
    }

    const variables = prepareAlumniProfileUpdateVariables(data);

    return renderMessageTemplate(template, variables);
  }

  /**
   * Get all promotion and alumni templates
   */
  async getAllPromotionAlumniTemplates() {
    return await db.messageTemplate.findMany({
      where: {
        category: {
          in: ["Promotion", "Graduation", "Alumni"],
        },
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Create or update a custom template
   */
  async createOrUpdateTemplate(data: {
    name: string;
    description?: string;
    type: MessageType;
    category: string;
    subject?: string;
    body: string;
    variables: string[];
    createdBy: string;
    schoolId: string;
  }) {
    const existing = await db.messageTemplate.findUnique({
      where: { 
        schoolId_name: {
          schoolId: data.schoolId,
          name: data.name
        }
      },
    });

    if (existing) {
      return await db.messageTemplate.update({
        where: { 
          schoolId_name: {
            schoolId: data.schoolId,
            name: data.name
          }
        },
        data: {
          description: data.description,
          type: data.type,
          category: data.category,
          subject: data.subject,
          body: data.body,
          variables: JSON.stringify(data.variables),
          updatedAt: new Date(),
        },
      });
    }

    return await db.messageTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        subject: data.subject,
        body: data.body,
        variables: JSON.stringify(data.variables),
        isActive: true,
        isDefault: false,
        createdBy: data.createdBy,
        school: {
          connect: { id: data.schoolId }
        }
      },
    });
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(name: string, schoolId: string) {
    return await db.messageTemplate.update({
      where: { 
        schoolId_name: {
          schoolId,
          name
        }
      },
      data: { isActive: false },
    });
  }

  /**
   * Activate a template
   */
  async activateTemplate(name: string, schoolId: string) {
    return await db.messageTemplate.update({
      where: { 
        schoolId_name: {
          schoolId,
          name
        }
      },
      data: { isActive: true },
    });
  }
}

// Export singleton instance
export const notificationTemplateService = new NotificationTemplateService();
