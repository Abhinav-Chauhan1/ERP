/**
 * Environment variable validation for security
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  
  // Audit logging
  AUDIT_LOG_SECRET: z.string().min(32, 'AUDIT_LOG_SECRET must be at least 32 characters').optional(),
  
  // Rate limiting
  REDIS_URL: z.string().url('Invalid Redis URL').optional(),
  
  // File storage
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required').optional(),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required').optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required').optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validate environment variables on startup
 */
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional security checks
    if (env.NODE_ENV === 'production') {
      if (!env.AUDIT_LOG_SECRET) {
        throw new Error('AUDIT_LOG_SECRET is required in production');
      }
      
      if (env.NEXTAUTH_SECRET === 'development-secret') {
        throw new Error('Must use secure NEXTAUTH_SECRET in production');
      }
    }
    
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }
}

// Validate on import in production
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}