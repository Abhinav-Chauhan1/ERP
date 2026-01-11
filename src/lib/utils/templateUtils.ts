/**
 * Template Utilities for Message Template Customization
 * 
 * This module provides utilities for working with message templates,
 * including variable replacement and template rendering.
 */

/**
 * Replace template variables with actual values
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns Rendered template string with variables replaced
 * 
 * @example
 * const template = "Hello {{name}}, welcome to {{school}}!";
 * const variables = { name: "John", school: "Springfield High" };
 * const result = replaceTemplateVariables(template, variables);
 * // Result: "Hello John, welcome to Springfield High!"
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;

  // Replace all {{variable}} patterns with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value?.toString() || "");
  });

  // Also replace any remaining {{variable}} patterns that weren't in the variables object
  result = result.replace(/{{(\w+)}}/g, "");

  return result;
}

/**
 * Validate that all required variables are present in the data
 * 
 * @param requiredVariables - Array of required variable names
 * @param data - Object containing variable values
 * @returns Object with validation result and missing variables
 */
export function validateTemplateVariables(
  requiredVariables: string[],
  data: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing = requiredVariables.filter(
    (variable) => data[variable] === undefined || data[variable] === null
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract variable names from a template string
 * 
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of variable names found in the template
 * 
 * @example
 * const template = "Hello {{name}}, your score is {{score}}";
 * const variables = extractTemplateVariables(template);
 * // Result: ["name", "score"]
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Render a complete message template with subject and body
 * 
 * @param template - Template object with subject and body
 * @param variables - Object containing variable values
 * @returns Rendered template with subject and body
 */
export function renderMessageTemplate(
  template: {
    subject?: string | null;
    body: string;
  },
  variables: Record<string, string | number | undefined>
): {
  subject: string | null;
  body: string;
} {
  return {
    subject: template.subject
      ? replaceTemplateVariables(template.subject, variables)
      : null,
    body: replaceTemplateVariables(template.body, variables),
  };
}

/**
 * Format date for template usage
 * 
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'time')
 * @returns Formatted date string
 */
export function formatDateForTemplate(
  date: Date,
  format: "short" | "long" | "time" = "short"
): string {
  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : format === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : { hour: "2-digit", minute: "2-digit", hour12: true };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Prepare promotion notification variables
 * 
 * @param data - Promotion data
 * @returns Variables object for promotion template
 */
export function preparePromotionVariables(data: {
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
}): Record<string, string> {
  return {
    parentName: data.parentName,
    studentName: data.studentName,
    sourceClass: data.sourceClass,
    sourceSection: data.sourceSection || "",
    targetClass: data.targetClass,
    targetSection: data.targetSection || "",
    targetAcademicYear: data.targetAcademicYear,
    rollNumber: data.rollNumber || "TBD",
    sessionStartDate: formatDateForTemplate(data.sessionStartDate, "long"),
    schoolName: data.schoolName,
    schoolPhone: data.schoolPhone,
  };
}

/**
 * Prepare graduation notification variables
 * 
 * @param data - Graduation data
 * @returns Variables object for graduation template
 */
export function prepareGraduationVariables(data: {
  parentName?: string;
  studentName: string;
  ceremonyDate: Date;
  ceremonyTime: string;
  ceremonyVenue: string;
  chiefGuest?: string;
  finalClass: string;
  finalSection?: string;
  graduationDate: Date;
  academicYear?: string;
  schoolName: string;
  schoolPhone: string;
  schoolEmail: string;
}): Record<string, string> {
  return {
    parentName: data.parentName || "",
    studentName: data.studentName,
    ceremonyDate: formatDateForTemplate(data.ceremonyDate, "long"),
    ceremonyTime: data.ceremonyTime,
    ceremonyVenue: data.ceremonyVenue,
    chiefGuest: data.chiefGuest || "To be announced",
    finalClass: data.finalClass,
    finalSection: data.finalSection || "",
    graduationDate: formatDateForTemplate(data.graduationDate, "long"),
    academicYear: data.academicYear || "",
    schoolName: data.schoolName,
    schoolPhone: data.schoolPhone,
    schoolEmail: data.schoolEmail,
  };
}

/**
 * Prepare alumni welcome variables
 * 
 * @param data - Alumni data
 * @returns Variables object for alumni welcome template
 */
export function prepareAlumniWelcomeVariables(data: {
  alumniName: string;
  graduationYear: number;
  finalClass: string;
  admissionId: string;
  portalUrl: string;
  schoolName: string;
  schoolPhone: string;
  schoolEmail: string;
}): Record<string, string> {
  return {
    alumniName: data.alumniName,
    graduationYear: data.graduationYear.toString(),
    finalClass: data.finalClass,
    admissionId: data.admissionId,
    portalUrl: data.portalUrl,
    schoolName: data.schoolName,
    schoolPhone: data.schoolPhone,
    schoolEmail: data.schoolEmail,
  };
}

/**
 * Prepare alumni event invitation variables
 * 
 * @param data - Event data
 * @returns Variables object for alumni event template
 */
export function prepareAlumniEventVariables(data: {
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
}): Record<string, string> {
  return {
    alumniName: data.alumniName,
    eventName: data.eventName,
    eventDate: formatDateForTemplate(data.eventDate, "long"),
    eventTime: data.eventTime,
    eventVenue: data.eventVenue,
    eventDescription: data.eventDescription,
    rsvpDeadline: formatDateForTemplate(data.rsvpDeadline, "long"),
    rsvpLink: data.rsvpLink,
    contactPerson: data.contactPerson,
    contactPhone: data.contactPhone,
    schoolName: data.schoolName,
    schoolPhone: data.schoolPhone,
    schoolEmail: data.schoolEmail,
  };
}

/**
 * Prepare alumni profile update reminder variables
 * 
 * @param data - Alumni profile data
 * @returns Variables object for profile update template
 */
export function prepareAlumniProfileUpdateVariables(data: {
  alumniName: string;
  lastUpdated: Date;
  graduationYear: number;
  currentOccupation?: string;
  profileUrl: string;
  schoolName: string;
  schoolEmail: string;
}): Record<string, string> {
  return {
    alumniName: data.alumniName,
    lastUpdated: formatDateForTemplate(data.lastUpdated, "long"),
    graduationYear: data.graduationYear.toString(),
    currentOccupation: data.currentOccupation || "Not specified",
    profileUrl: data.profileUrl,
    schoolName: data.schoolName,
    schoolEmail: data.schoolEmail,
  };
}
