/**
 * Template Service
 * 
 * This service handles message template selection with multi-language support.
 * It provides functions to retrieve templates based on language preferences
 * with fallback to default language.
 * 
 * Requirements: 16.1, 16.3, 16.4, 16.5
 */

import { db } from '@/lib/db';
import { MessageType } from '@prisma/client';

// Default language for fallback
const DEFAULT_LANGUAGE = 'en';

/**
 * Get template by name and language
 * Requirement: 16.3
 * 
 * @param templateName - Name of the template
 * @param language - Preferred language code (e.g., 'en', 'hi')
 * @param messageType - Type of message (SMS, EMAIL, WHATSAPP, BOTH)
 * @returns Template or null if not found
 */
export async function getTemplateByLanguage(
  templateName: string,
  language: string,
  messageType?: MessageType
): Promise<any | null> {
  try {
    // Build query conditions
    const whereConditions: any = {
      name: templateName,
      isActive: true,
    };

    // Add message type filter if provided
    if (messageType) {
      whereConditions.type = messageType;
    }

    // Try to find template in preferred language
    const preferredTemplate = await db.messageTemplate.findFirst({
      where: {
        ...whereConditions,
        whatsappLanguage: language,
      },
    });

    if (preferredTemplate) {
      return preferredTemplate;
    }

    // Fallback to default language
    // Requirement: 16.4
    const defaultTemplate = await db.messageTemplate.findFirst({
      where: {
        ...whereConditions,
        whatsappLanguage: DEFAULT_LANGUAGE,
      },
    });

    if (defaultTemplate) {
      return defaultTemplate;
    }

    // If no language-specific template found, try to find any active template with that name
    const anyTemplate = await db.messageTemplate.findFirst({
      where: whereConditions,
    });

    return anyTemplate;
  } catch (error: any) {
    console.error('Error getting template by language:', error);
    return null;
  }
}

/**
 * Get all templates for a specific language
 * Requirement: 16.1
 * 
 * @param language - Language code
 * @param messageType - Optional message type filter
 * @returns Array of templates
 */
export async function getTemplatesByLanguage(
  language: string,
  messageType?: MessageType
): Promise<any[]> {
  try {
    const whereConditions: any = {
      isActive: true,
      whatsappLanguage: language,
    };

    if (messageType) {
      whereConditions.type = messageType;
    }

    const templates = await db.messageTemplate.findMany({
      where: whereConditions,
      orderBy: {
        name: 'asc',
      },
    });

    return templates;
  } catch (error: any) {
    console.error('Error getting templates by language:', error);
    return [];
  }
}

/**
 * Get template with fallback logic
 * Requirement: 16.4, 16.5
 * 
 * This function implements the complete fallback chain:
 * 1. Try preferred language
 * 2. Fall back to default language (English)
 * 3. Fall back to any active template with the same name
 * 
 * @param templateName - Name of the template
 * @param preferredLanguage - User's preferred language
 * @param messageType - Type of message
 * @returns Template or null
 */
export async function getTemplateWithFallback(
  templateName: string,
  preferredLanguage: string = DEFAULT_LANGUAGE,
  messageType?: MessageType
): Promise<any | null> {
  try {
    // Step 1: Try preferred language
    let template = await getTemplateByLanguage(
      templateName,
      preferredLanguage,
      messageType
    );

    if (template) {
      return template;
    }

    // Step 2: Fall back to default language if preferred language is not default
    if (preferredLanguage !== DEFAULT_LANGUAGE) {
      template = await getTemplateByLanguage(
        templateName,
        DEFAULT_LANGUAGE,
        messageType
      );

      if (template) {
        console.log(
          `Template "${templateName}" not found in language "${preferredLanguage}", using default language "${DEFAULT_LANGUAGE}"`
        );
        return template;
      }
    }

    // Step 3: Fall back to any active template with the same name
    const whereConditions: any = {
      name: templateName,
      isActive: true,
    };

    if (messageType) {
      whereConditions.type = messageType;
    }

    template = await db.messageTemplate.findFirst({
      where: whereConditions,
    });

    if (template) {
      console.log(
        `Template "${templateName}" not found in any specific language, using first available template`
      );
      return template;
    }

    console.warn(`Template "${templateName}" not found`);
    return null;
  } catch (error: any) {
    console.error('Error getting template with fallback:', error);
    return null;
  }
}

/**
 * Render template with variables
 * 
 * @param template - Template object
 * @param variables - Object with variable values
 * @returns Rendered template body
 */
export function renderTemplate(
  template: any,
  variables: Record<string, string>
): string {
  try {
    let renderedBody = template.body;

    // Replace variables in template
    // Variables are in format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedBody = renderedBody.replace(regex, value);
    });

    return renderedBody;
  } catch (error: any) {
    console.error('Error rendering template:', error);
    return template.body;
  }
}

/**
 * Get available languages for templates
 * 
 * @returns Array of language codes
 */
export async function getAvailableTemplateLanguages(): Promise<string[]> {
  try {
    const templates = await db.messageTemplate.findMany({
      where: {
        isActive: true,
        whatsappLanguage: {
          not: null,
        },
      },
      select: {
        whatsappLanguage: true,
      },
      distinct: ['whatsappLanguage'],
    });

    const languages = templates
      .map((t) => t.whatsappLanguage)
      .filter((lang): lang is string => lang !== null);

    return languages;
  } catch (error: any) {
    console.error('Error getting available template languages:', error);
    return [DEFAULT_LANGUAGE];
  }
}

/**
 * Check if template exists in language
 * 
 * @param templateName - Name of the template
 * @param language - Language code
 * @returns Boolean indicating if template exists
 */
export async function templateExistsInLanguage(
  templateName: string,
  language: string
): Promise<boolean> {
  try {
    const template = await db.messageTemplate.findFirst({
      where: {
        name: templateName,
        whatsappLanguage: language,
        isActive: true,
      },
    });

    return template !== null;
  } catch (error: any) {
    console.error('Error checking template existence:', error);
    return false;
  }
}
