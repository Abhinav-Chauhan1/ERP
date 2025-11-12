/**
 * Input Sanitization Utility
 * Sanitizes user inputs to prevent XSS and injection attacks
 * Requirements: 10.1, 10.5
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");
  
  // Remove potentially dangerous tags
  const dangerousTags = [
    "iframe",
    "object",
    "embed",
    "applet",
    "meta",
    "link",
    "style",
    "form",
    "input",
    "button",
    "textarea",
    "select",
  ];
  
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    sanitized = sanitized.replace(regex, "");
    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    sanitized = sanitized.replace(selfClosingRegex, "");
  });
  
  return sanitized.trim();
}

/**
 * Sanitize plain text input
 * Removes HTML tags and encodes special characters
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  
  return sanitized.trim();
}

/**
 * Sanitize email address
 * Validates and normalizes email format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  // Basic email validation pattern
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailPattern.test(sanitized)) {
    return "";
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 * Validates and normalizes URL format, removes dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  
  let sanitized = url.trim();
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  // Check for dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  const lowerUrl = sanitized.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }
  
  // Only allow http, https, and mailto protocols
  if (
    !lowerUrl.startsWith("http://") &&
    !lowerUrl.startsWith("https://") &&
    !lowerUrl.startsWith("mailto:") &&
    !lowerUrl.startsWith("/")
  ) {
    return "";
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + and -
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove all characters except digits, +, -, (, ), and spaces
  let sanitized = phone.replace(/[^\d+\-() ]/g, "");
  
  return sanitized.trim();
}

/**
 * Sanitize alphanumeric input
 * Allows only letters, numbers, and specified special characters
 */
export function sanitizeAlphanumeric(
  input: string,
  allowedSpecialChars: string = ""
): string {
  if (!input) return "";
  
  // Create regex pattern with allowed special characters
  const specialCharsEscaped = allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`[^a-zA-Z0-9${specialCharsEscaped}]`, "g");
  
  return input.replace(pattern, "").trim();
}

/**
 * Sanitize numeric input
 * Allows only numbers and optional decimal point
 */
export function sanitizeNumeric(input: string, allowDecimal: boolean = false): string {
  if (!input) return "";
  
  if (allowDecimal) {
    // Allow digits and one decimal point
    return input.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  }
  
  // Allow only digits
  return input.replace(/[^\d]/g, "");
}

/**
 * Sanitize SQL input
 * Removes SQL injection patterns
 * Note: This is a basic implementation. Always use parameterized queries!
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return "";
  
  // Remove SQL keywords and dangerous characters
  let sanitized = input
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi, "")
    .replace(/[;'"\\]/g, "");
  
  return sanitized.trim();
}

/**
 * Sanitize object by applying sanitization to all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeText
): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizer(sanitized[key]) as any;
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sanitizer);
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize JSON input
 * Parses JSON and sanitizes all string values
 */
export function sanitizeJson(jsonString: string): any {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch (error) {
    throw new Error("Invalid JSON input");
  }
}

/**
 * Remove null bytes from input
 * Null bytes can be used to bypass security checks
 */
export function removeNullBytes(input: string): string {
  return input.replace(/\0/g, "");
}

/**
 * Truncate string to maximum length
 * Prevents buffer overflow attacks
 */
export function truncateString(input: string, maxLength: number): string {
  if (!input) return "";
  
  if (input.length <= maxLength) {
    return input;
  }
  
  return input.substring(0, maxLength);
}

/**
 * Comprehensive input sanitization
 * Applies multiple sanitization techniques
 */
export function sanitizeInput(input: string, options?: {
  maxLength?: number;
  allowHtml?: boolean;
  type?: "text" | "email" | "url" | "phone" | "alphanumeric" | "numeric";
}): string {
  if (!input) return "";
  
  let sanitized = input;
  
  // Remove null bytes
  sanitized = removeNullBytes(sanitized);
  
  // Apply type-specific sanitization
  switch (options?.type) {
    case "email":
      sanitized = sanitizeEmail(sanitized);
      break;
    case "url":
      sanitized = sanitizeUrl(sanitized);
      break;
    case "phone":
      sanitized = sanitizePhoneNumber(sanitized);
      break;
    case "alphanumeric":
      sanitized = sanitizeAlphanumeric(sanitized);
      break;
    case "numeric":
      sanitized = sanitizeNumeric(sanitized);
      break;
    case "text":
    default:
      sanitized = options?.allowHtml ? sanitizeHtml(sanitized) : sanitizeText(sanitized);
      break;
  }
  
  // Truncate if max length specified
  if (options?.maxLength) {
    sanitized = truncateString(sanitized, options.maxLength);
  }
  
  return sanitized;
}
