/**
 * Certificate Template Utilities
 * 
 * Utility functions for certificate template validation, rendering, and processing.
 */

/**
 * Default certificate template layouts
 */
export const DEFAULT_LAYOUTS = {
  classic: {
    header: { height: '15%', alignment: 'center' },
    body: { height: '70%', alignment: 'center', padding: '2rem' },
    footer: { height: '15%', alignment: 'center' },
  },
  modern: {
    header: { height: '20%', alignment: 'left', padding: '1rem' },
    body: { height: '60%', alignment: 'left', padding: '2rem' },
    footer: { height: '20%', alignment: 'right', padding: '1rem' },
  },
  elegant: {
    header: { height: '10%', alignment: 'center' },
    body: { height: '75%', alignment: 'center', padding: '3rem' },
    footer: { height: '15%', alignment: 'center' },
  },
};

/**
 * Default certificate template styles
 */
export const DEFAULT_STYLES = {
  classic: {
    fontFamily: 'Georgia, serif',
    primaryColor: '#1a365d',
    secondaryColor: '#2c5282',
    backgroundColor: '#ffffff',
    borderColor: '#d4af37',
    borderWidth: '8px',
    borderStyle: 'double',
  },
  modern: {
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    borderColor: '#2563eb',
    borderWidth: '4px',
    borderStyle: 'solid',
  },
  elegant: {
    fontFamily: 'Times New Roman, serif',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    backgroundColor: '#faf5ff',
    borderColor: '#7c3aed',
    borderWidth: '6px',
    borderStyle: 'solid',
  },
};

/**
 * Validate certificate template content
 */
export function validateTemplateContent(content: string, mergeFields: string[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if content is not empty
  if (!content || content.trim().length === 0) {
    errors.push('Template content cannot be empty');
  }

  // Extract all merge fields from content
  const mergeFieldRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const usedFields = new Set<string>();
  let match;

  while ((match = mergeFieldRegex.exec(content)) !== null) {
    usedFields.add(match[1]);
  }

  // Check if all used fields are declared
  usedFields.forEach(field => {
    if (!mergeFields.includes(field)) {
      warnings.push(`Merge field '${field}' is used but not declared in mergeFields array`);
    }
  });

  // Check if declared fields are used
  mergeFields.forEach(field => {
    if (!usedFields.has(field)) {
      warnings.push(`Merge field '${field}' is declared but not used in template`);
    }
  });

  // Check for basic HTML structure
  if (!content.includes('<') || !content.includes('>')) {
    warnings.push('Template content should contain HTML markup for proper rendering');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate certificate template layout
 */
export function validateTemplateLayout(layout: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required sections
  const requiredSections = ['header', 'body', 'footer'];
  requiredSections.forEach(section => {
    if (!layout[section]) {
      errors.push(`Layout must include '${section}' section`);
    }
  });

  // Validate section properties
  Object.keys(layout).forEach(section => {
    const sectionConfig = layout[section];
    
    if (sectionConfig.height && !isValidCSSValue(sectionConfig.height)) {
      errors.push(`Invalid height value for ${section}: ${sectionConfig.height}`);
    }
    
    if (sectionConfig.alignment && !['left', 'center', 'right', 'justify'].includes(sectionConfig.alignment)) {
      errors.push(`Invalid alignment value for ${section}: ${sectionConfig.alignment}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate certificate template styling
 */
export function validateTemplateStyling(styling: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate color values
  const colorFields = ['primaryColor', 'secondaryColor', 'backgroundColor', 'borderColor'];
  colorFields.forEach(field => {
    if (styling[field] && !isValidColor(styling[field])) {
      errors.push(`Invalid color value for ${field}: ${styling[field]}`);
    }
  });

  // Validate border width
  if (styling.borderWidth && !isValidCSSValue(styling.borderWidth)) {
    errors.push(`Invalid border width: ${styling.borderWidth}`);
  }

  // Validate border style
  const validBorderStyles = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
  if (styling.borderStyle && !validBorderStyles.includes(styling.borderStyle)) {
    errors.push(`Invalid border style: ${styling.borderStyle}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a value is a valid CSS color
 */
function isValidColor(color: string): boolean {
  // Check hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check rgb/rgba
  if (/^rgba?\(/.test(color)) {
    return true;
  }
  
  // Check hsl/hsla
  if (/^hsla?\(/.test(color)) {
    return true;
  }
  
  // Check named colors (basic check)
  const namedColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'purple', 'orange', 'pink'];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Check if a value is a valid CSS value (for dimensions)
 */
function isValidCSSValue(value: string): boolean {
  // Check percentage
  if (/^\d+(\.\d+)?%$/.test(value)) {
    return true;
  }
  
  // Check pixels
  if (/^\d+(\.\d+)?px$/.test(value)) {
    return true;
  }
  
  // Check rem/em
  if (/^\d+(\.\d+)?(rem|em)$/.test(value)) {
    return true;
  }
  
  // Check viewport units
  if (/^\d+(\.\d+)?(vh|vw|vmin|vmax)$/.test(value)) {
    return true;
  }
  
  return false;
}

/**
 * Generate a unique certificate number
 */
export function generateCertificateNumber(prefix: string = 'CERT'): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}-${year}-${timestamp}-${random}`;
}

/**
 * Generate a verification code for certificate
 */
export function generateVerificationCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return `${timestamp}${random}`;
}

/**
 * Extract merge fields from template content
 */
export function extractMergeFields(content: string): string[] {
  const mergeFieldRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const fields = new Set<string>();
  let match;

  while ((match = mergeFieldRegex.exec(content)) !== null) {
    fields.add(match[1]);
  }

  return Array.from(fields);
}

/**
 * Get default template content for a certificate type
 */
export function getDefaultTemplateContent(type: string): string {
  const templates: Record<string, string> = {
    ACHIEVEMENT: `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; color: {{primaryColor}};">
          Certificate of Achievement
        </h1>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          This is to certify that
        </p>
        <h2 style="font-size: 2.5rem; margin: 1rem 0; color: {{secondaryColor}};">
          {{studentName}}
        </h2>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          has successfully achieved
        </p>
        <h3 style="font-size: 2rem; margin: 1rem 0;">
          {{achievementTitle}}
        </h3>
        <p style="font-size: 1rem; margin: 2rem 0;">
          on {{issueDate}}
        </p>
        <div style="margin-top: 3rem; display: flex; justify-content: space-around;">
          <div>
            <p>_____________________</p>
            <p>Principal</p>
          </div>
          <div>
            <p>_____________________</p>
            <p>Date</p>
          </div>
        </div>
      </div>
    `,
    COMPLETION: `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; color: {{primaryColor}};">
          Certificate of Completion
        </h1>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          This certifies that
        </p>
        <h2 style="font-size: 2.5rem; margin: 1rem 0; color: {{secondaryColor}};">
          {{studentName}}
        </h2>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          has successfully completed
        </p>
        <h3 style="font-size: 2rem; margin: 1rem 0;">
          {{courseName}}
        </h3>
        <p style="font-size: 1rem; margin: 1rem 0;">
          with a grade of <strong>{{grade}}</strong>
        </p>
        <p style="font-size: 1rem; margin: 2rem 0;">
          Academic Year: {{academicYear}}
        </p>
        <p style="font-size: 0.9rem; margin-top: 3rem;">
          Certificate No: {{certificateNumber}}
        </p>
      </div>
    `,
    PARTICIPATION: `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; color: {{primaryColor}};">
          Certificate of Participation
        </h1>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          This is awarded to
        </p>
        <h2 style="font-size: 2.5rem; margin: 1rem 0; color: {{secondaryColor}};">
          {{studentName}}
        </h2>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          for participating in
        </p>
        <h3 style="font-size: 2rem; margin: 1rem 0;">
          {{eventName}}
        </h3>
        <p style="font-size: 1rem; margin: 2rem 0;">
          held on {{eventDate}}
        </p>
      </div>
    `,
    MERIT: `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; color: {{primaryColor}};">
          Certificate of Merit
        </h1>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          Presented to
        </p>
        <h2 style="font-size: 2.5rem; margin: 1rem 0; color: {{secondaryColor}};">
          {{studentName}}
        </h2>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          for outstanding performance in
        </p>
        <h3 style="font-size: 2rem; margin: 1rem 0;">
          {{courseName}}
        </h3>
        <p style="font-size: 1rem; margin: 1rem 0;">
          Rank: <strong>{{rank}}</strong> | Percentage: <strong>{{percentage}}</strong>
        </p>
        <p style="font-size: 1rem; margin: 2rem 0;">
          {{academicYear}}
        </p>
      </div>
    `,
    CUSTOM: `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">
          Certificate
        </h1>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          This is to certify that
        </p>
        <h2 style="font-size: 2.5rem; margin: 1rem 0;">
          {{studentName}}
        </h2>
        <p style="font-size: 1.2rem; margin: 2rem 0;">
          [Add your custom content here]
        </p>
      </div>
    `,
  };

  return templates[type] || templates.CUSTOM;
}

/**
 * Sanitize HTML content for certificate templates
 */
export function sanitizeTemplateContent(content: string): string {
  // Remove potentially dangerous tags and attributes
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link'];
  let sanitized = content;

  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}
