/**
 * WhatsApp Template Validation Utilities
 * 
 * Validates WhatsApp Business API template format and variable parameters
 * according to WhatsApp's template message requirements.
 * 
 * Requirements: 9.2, 9.4 - WhatsApp Template Format Validation
 */

export interface WhatsAppTemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
}

export interface WhatsAppTemplateVariable {
  name: string;
  position: number;
  type: 'text' | 'currency' | 'date_time';
}

/**
 * Validates WhatsApp template name format
 * - Must be lowercase
 * - Can only contain letters, numbers, and underscores
 * - Must start with a letter
 * - Length between 1-512 characters
 */
export function validateWhatsAppTemplateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Template name is required" };
  }

  if (name.length > 512) {
    return { isValid: false, error: "Template name must be 512 characters or less" };
  }

  // Must be lowercase
  if (name !== name.toLowerCase()) {
    return { isValid: false, error: "Template name must be lowercase" };
  }

  // Must start with a letter
  if (!/^[a-z]/.test(name)) {
    return { isValid: false, error: "Template name must start with a letter" };
  }

  // Can only contain letters, numbers, and underscores
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return { isValid: false, error: "Template name can only contain lowercase letters, numbers, and underscores" };
  }

  return { isValid: true };
}

/**
 * Validates WhatsApp template body format
 * - Checks for valid variable syntax {{1}}, {{2}}, etc.
 * - Ensures variables are sequential starting from 1
 * - Maximum 1024 characters
 */
export function validateWhatsAppTemplateBody(body: string): WhatsAppTemplateValidationResult {
  const result: WhatsAppTemplateValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    variables: [],
  };

  if (!body || body.trim().length === 0) {
    result.isValid = false;
    result.errors.push("Template body is required");
    return result;
  }

  if (body.length > 1024) {
    result.isValid = false;
    result.errors.push("Template body must be 1024 characters or less");
  }

  // Extract WhatsApp-style variables {{1}}, {{2}}, etc.
  const whatsappVariableRegex = /\{\{(\d+)\}\}/g;
  const matches = [...body.matchAll(whatsappVariableRegex)];
  
  if (matches.length > 0) {
    const variableNumbers = matches.map(match => parseInt(match[1]));
    const uniqueNumbers = [...new Set(variableNumbers)];
    
    // Check if variables are sequential starting from 1
    const expectedSequence = Array.from({ length: uniqueNumbers.length }, (_, i) => i + 1);
    const sortedNumbers = [...uniqueNumbers].sort((a, b) => a - b);
    
    if (JSON.stringify(sortedNumbers) !== JSON.stringify(expectedSequence)) {
      result.isValid = false;
      result.errors.push(
        `WhatsApp template variables must be sequential starting from {{1}}. Found: ${sortedNumbers.join(', ')}`
      );
    }

    // Maximum 10 variables per template
    if (uniqueNumbers.length > 10) {
      result.isValid = false;
      result.errors.push("WhatsApp templates support a maximum of 10 variables");
    }

    result.variables = uniqueNumbers.map(num => `{{${num}}}`);
  }

  // Check for old-style variables {{variableName}} and warn
  const oldStyleVariableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const oldStyleMatches = [...body.matchAll(oldStyleVariableRegex)];
  
  if (oldStyleMatches.length > 0) {
    result.warnings.push(
      `Found named variables (${oldStyleMatches.map(m => `{{${m[1]}}}`).join(', ')}). ` +
      `WhatsApp templates require numbered variables like {{1}}, {{2}}, etc.`
    );
  }

  // Check for unsupported formatting
  if (body.includes('*') || body.includes('_') || body.includes('~')) {
    result.warnings.push(
      "WhatsApp templates support limited formatting. Bold (*text*), italic (_text_), and strikethrough (~text~) " +
      "may not render as expected in all template types."
    );
  }

  return result;
}

/**
 * Validates WhatsApp template language code
 */
export function validateWhatsAppLanguageCode(code: string): { isValid: boolean; error?: string } {
  const supportedLanguages = [
    'en', 'en_US', 'en_GB', 'hi', 'hi_IN',
    'es', 'es_ES', 'es_MX', 'pt_BR', 'pt_PT',
    'fr', 'de', 'it', 'ja', 'ko', 'zh_CN', 'zh_TW',
    'ar', 'ru', 'tr', 'id', 'ms', 'th', 'vi'
  ];

  if (!code || code.trim().length === 0) {
    return { isValid: false, error: "Language code is required" };
  }

  if (!supportedLanguages.includes(code)) {
    return { 
      isValid: false, 
      error: `Unsupported language code: ${code}. Must be one of: ${supportedLanguages.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Converts old-style template variables to WhatsApp format
 * Example: "Hello {{studentName}}, your attendance is {{percentage}}%"
 * Becomes: "Hello {{1}}, your attendance is {{2}}%"
 * Returns both the converted template and a mapping of variables
 */
export function convertToWhatsAppFormat(
  template: string,
  variableNames: string[]
): { 
  convertedTemplate: string; 
  variableMapping: Record<string, number>;
  success: boolean;
  error?: string;
} {
  if (!template) {
    return {
      convertedTemplate: '',
      variableMapping: {},
      success: false,
      error: 'Template is required'
    };
  }

  let convertedTemplate = template;
  const variableMapping: Record<string, number> = {};
  let position = 1;

  // Sort variable names by length (longest first) to avoid partial replacements
  const sortedVariables = [...variableNames].sort((a, b) => b.length - a.length);

  for (const varName of sortedVariables) {
    const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
    if (regex.test(convertedTemplate)) {
      variableMapping[varName] = position;
      convertedTemplate = convertedTemplate.replace(regex, `{{${position}}}`);
      position++;
    }
  }

  return {
    convertedTemplate,
    variableMapping,
    success: true
  };
}

/**
 * Validates complete WhatsApp template
 */
export function validateWhatsAppTemplate(data: {
  name: string;
  body: string;
  language: string;
}): WhatsAppTemplateValidationResult {
  const result: WhatsAppTemplateValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    variables: [],
  };

  // Validate template name
  const nameValidation = validateWhatsAppTemplateName(data.name);
  if (!nameValidation.isValid) {
    result.isValid = false;
    result.errors.push(nameValidation.error!);
  }

  // Validate template body
  const bodyValidation = validateWhatsAppTemplateBody(data.body);
  if (!bodyValidation.isValid) {
    result.isValid = false;
    result.errors.push(...bodyValidation.errors);
  }
  result.warnings.push(...bodyValidation.warnings);
  result.variables = bodyValidation.variables;

  // Validate language code
  const languageValidation = validateWhatsAppLanguageCode(data.language);
  if (!languageValidation.isValid) {
    result.isValid = false;
    result.errors.push(languageValidation.error!);
  }

  return result;
}

/**
 * Extracts variable parameters from template body
 */
export function extractWhatsAppVariables(body: string): WhatsAppTemplateVariable[] {
  const whatsappVariableRegex = /\{\{(\d+)\}\}/g;
  const matches = [...body.matchAll(whatsappVariableRegex)];
  
  const variables: WhatsAppTemplateVariable[] = [];
  const seen = new Set<number>();

  for (const match of matches) {
    const position = parseInt(match[1]);
    if (!seen.has(position)) {
      variables.push({
        name: `param${position}`,
        position,
        type: 'text'
      });
      seen.add(position);
    }
  }

  return variables.sort((a, b) => a.position - b.position);
}

/**
 * Renders WhatsApp template with provided parameters
 */
export function renderWhatsAppTemplate(
  template: string,
  parameters: Record<number, string>
): string {
  let rendered = template;

  Object.entries(parameters).forEach(([position, value]) => {
    const regex = new RegExp(`\\{\\{${position}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}
