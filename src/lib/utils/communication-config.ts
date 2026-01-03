/**
 * Communication Service Configuration Validation
 * 
 * This utility validates environment variables for MSG91 SMS and WhatsApp Business API.
 * It ensures all required credentials are present and properly formatted before
 * attempting to use the communication services.
 */

/**
 * MSG91 Configuration Interface
 */
export interface MSG91Config {
  authKey: string;
  senderId: string;
  route: 'transactional' | 'promotional';
  country: string;
}

/**
 * WhatsApp Business API Configuration Interface
 */
export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appSecret: string;
  apiVersion: string;
  verifyToken: string;
}

/**
 * Configuration Validation Result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates MSG91 configuration from environment variables
 * 
 * @returns Validation result with any errors or warnings
 */
export function validateMSG91Config(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if MSG91 is enabled
  const useMSG91 = process.env.USE_MSG91 === 'true';
  
  if (!useMSG91) {
    warnings.push('MSG91 is not enabled (USE_MSG91=false)');
    return { isValid: true, errors, warnings };
  }

  // Validate required fields
  if (!process.env.MSG91_AUTH_KEY) {
    errors.push('MSG91_AUTH_KEY is required');
  } else if (process.env.MSG91_AUTH_KEY.length < 20) {
    warnings.push('MSG91_AUTH_KEY seems too short, please verify');
  }

  if (!process.env.MSG91_SENDER_ID) {
    errors.push('MSG91_SENDER_ID is required');
  } else {
    const senderId = process.env.MSG91_SENDER_ID;
    if (senderId.length !== 6) {
      warnings.push('MSG91_SENDER_ID should be exactly 6 characters');
    }
    if (!/^[A-Z]+$/.test(senderId)) {
      warnings.push('MSG91_SENDER_ID should contain only uppercase letters');
    }
  }

  if (!process.env.MSG91_ROUTE) {
    errors.push('MSG91_ROUTE is required');
  } else {
    const route = process.env.MSG91_ROUTE;
    if (route !== 'transactional' && route !== 'promotional') {
      errors.push('MSG91_ROUTE must be either "transactional" or "promotional"');
    }
  }

  if (!process.env.MSG91_COUNTRY) {
    warnings.push('MSG91_COUNTRY not set, defaulting to "91" (India)');
  } else {
    const country = process.env.MSG91_COUNTRY;
    if (!/^\d+$/.test(country)) {
      errors.push('MSG91_COUNTRY must be a numeric country code');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates WhatsApp Business API configuration from environment variables
 * 
 * @returns Validation result with any errors or warnings
 */
export function validateWhatsAppConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if WhatsApp is enabled
  const useWhatsApp = process.env.USE_WHATSAPP === 'true';
  
  if (!useWhatsApp) {
    warnings.push('WhatsApp is not enabled (USE_WHATSAPP=false)');
    return { isValid: true, errors, warnings };
  }

  // Validate required fields
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    errors.push('WHATSAPP_ACCESS_TOKEN is required');
  } else if (process.env.WHATSAPP_ACCESS_TOKEN.length < 50) {
    warnings.push('WHATSAPP_ACCESS_TOKEN seems too short, please verify');
  }

  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
    errors.push('WHATSAPP_PHONE_NUMBER_ID is required');
  } else if (!/^\d+$/.test(process.env.WHATSAPP_PHONE_NUMBER_ID)) {
    warnings.push('WHATSAPP_PHONE_NUMBER_ID should be numeric');
  }

  if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    errors.push('WHATSAPP_BUSINESS_ACCOUNT_ID is required');
  } else if (!/^\d+$/.test(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID)) {
    warnings.push('WHATSAPP_BUSINESS_ACCOUNT_ID should be numeric');
  }

  if (!process.env.WHATSAPP_APP_SECRET) {
    errors.push('WHATSAPP_APP_SECRET is required for webhook verification');
  } else if (process.env.WHATSAPP_APP_SECRET.length < 20) {
    warnings.push('WHATSAPP_APP_SECRET seems too short, please verify');
  }

  if (!process.env.WHATSAPP_API_VERSION) {
    warnings.push('WHATSAPP_API_VERSION not set, defaulting to "v18.0"');
  } else {
    const version = process.env.WHATSAPP_API_VERSION;
    if (!/^v\d+\.\d+$/.test(version)) {
      warnings.push('WHATSAPP_API_VERSION should be in format "vX.Y" (e.g., "v18.0")');
    }
  }

  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    errors.push('WHATSAPP_VERIFY_TOKEN is required for webhook verification');
  } else if (process.env.WHATSAPP_VERIFY_TOKEN.length < 10) {
    warnings.push('WHATSAPP_VERIFY_TOKEN should be at least 10 characters for security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets MSG91 configuration from environment variables
 * Throws an error if configuration is invalid
 * 
 * @returns MSG91 configuration object
 * @throws Error if configuration is invalid
 */
export function getMSG91Config(): MSG91Config {
  const validation = validateMSG91Config();
  
  if (!validation.isValid) {
    throw new Error(
      `Invalid MSG91 configuration:\n${validation.errors.join('\n')}`
    );
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('MSG91 Configuration Warnings:', validation.warnings);
  }

  return {
    authKey: process.env.MSG91_AUTH_KEY!,
    senderId: process.env.MSG91_SENDER_ID!,
    route: (process.env.MSG91_ROUTE as 'transactional' | 'promotional') || 'transactional',
    country: process.env.MSG91_COUNTRY || '91'
  };
}

/**
 * Gets WhatsApp Business API configuration from environment variables
 * Throws an error if configuration is invalid
 * 
 * @returns WhatsApp configuration object
 * @throws Error if configuration is invalid
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  const validation = validateWhatsAppConfig();
  
  if (!validation.isValid) {
    throw new Error(
      `Invalid WhatsApp configuration:\n${validation.errors.join('\n')}`
    );
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('WhatsApp Configuration Warnings:', validation.warnings);
  }

  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!
  };
}

/**
 * Checks if MSG91 is configured and enabled
 * 
 * @returns true if MSG91 is properly configured and enabled
 */
export function isMSG91Configured(): boolean {
  const useMSG91 = process.env.USE_MSG91 === 'true';
  if (!useMSG91) return false;

  const validation = validateMSG91Config();
  return validation.isValid;
}

/**
 * Checks if WhatsApp is configured and enabled
 * 
 * @returns true if WhatsApp is properly configured and enabled
 */
export function isWhatsAppConfigured(): boolean {
  const useWhatsApp = process.env.USE_WHATSAPP === 'true';
  if (!useWhatsApp) return false;

  const validation = validateWhatsAppConfig();
  return validation.isValid;
}

/**
 * Validates all communication service configurations
 * Useful for startup checks
 * 
 * @returns Combined validation result
 */
export function validateAllCommunicationConfigs(): {
  msg91: ConfigValidationResult;
  whatsapp: ConfigValidationResult;
  hasErrors: boolean;
} {
  const msg91 = validateMSG91Config();
  const whatsapp = validateWhatsAppConfig();

  return {
    msg91,
    whatsapp,
    hasErrors: !msg91.isValid || !whatsapp.isValid
  };
}

/**
 * Logs configuration status to console
 * Useful for debugging and startup diagnostics
 */
export function logCommunicationConfigStatus(): void {
  console.log('\n=== Communication Service Configuration Status ===');
  
  const msg91Enabled = process.env.USE_MSG91 === 'true';
  const whatsappEnabled = process.env.USE_WHATSAPP === 'true';
  
  console.log(`MSG91 Enabled: ${msg91Enabled}`);
  console.log(`WhatsApp Enabled: ${whatsappEnabled}`);
  
  if (msg91Enabled) {
    const msg91Validation = validateMSG91Config();
    console.log(`\nMSG91 Status: ${msg91Validation.isValid ? '✓ Valid' : '✗ Invalid'}`);
    if (msg91Validation.errors.length > 0) {
      console.error('MSG91 Errors:', msg91Validation.errors);
    }
    if (msg91Validation.warnings.length > 0) {
      console.warn('MSG91 Warnings:', msg91Validation.warnings);
    }
  }
  
  if (whatsappEnabled) {
    const whatsappValidation = validateWhatsAppConfig();
    console.log(`\nWhatsApp Status: ${whatsappValidation.isValid ? '✓ Valid' : '✗ Invalid'}`);
    if (whatsappValidation.errors.length > 0) {
      console.error('WhatsApp Errors:', whatsappValidation.errors);
    }
    if (whatsappValidation.warnings.length > 0) {
      console.warn('WhatsApp Warnings:', whatsappValidation.warnings);
    }
  }
  
  console.log('=================================================\n');
}
