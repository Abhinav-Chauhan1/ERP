#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * 
 * Validates critical environment variables to prevent common configuration issues.
 * Run this script before deployment to catch configuration errors early.
 * 
 * Usage:
 *   npm run validate-env
 *   or
 *   tsx scripts/validate-env-vars.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const result: ValidationResult = {
  valid: true,
  errors: [],
  warnings: []
};

console.log('🔍 Validating environment variables...\n');

// Helper function to check if a URL is valid
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper function to check if URL has path segments
function hasPathSegments(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname !== '/' && parsed.pathname !== '';
  } catch {
    return false;
  }
}

// 1. Validate AUTH_URL
console.log('📋 Checking AUTH_URL...');
const authUrl = process.env.AUTH_URL;

if (!authUrl) {
  result.errors.push('AUTH_URL is not set');
  result.valid = false;
} else if (!isValidUrl(authUrl)) {
  result.errors.push(`AUTH_URL is not a valid URL: ${authUrl}`);
  result.valid = false;
} else if (hasPathSegments(authUrl)) {
  result.errors.push(
    `AUTH_URL should not include path segments: ${authUrl}\n` +
    `  ❌ Current: ${authUrl}\n` +
    `  ✅ Should be: ${new URL(authUrl).origin}`
  );
  result.valid = false;
} else if (authUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
  result.warnings.push('AUTH_URL uses localhost in production environment');
} else {
  console.log(`  ✅ Valid: ${authUrl}`);
}

// 2. Validate NEXT_PUBLIC_APP_URL
console.log('\n📋 Checking NEXT_PUBLIC_APP_URL...');
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl) {
  result.warnings.push('NEXT_PUBLIC_APP_URL is not set');
} else if (!isValidUrl(appUrl)) {
  result.errors.push(`NEXT_PUBLIC_APP_URL is not a valid URL: ${appUrl}`);
  result.valid = false;
} else if (hasPathSegments(appUrl)) {
  result.errors.push(
    `NEXT_PUBLIC_APP_URL should not include path segments: ${appUrl}\n` +
    `  ❌ Current: ${appUrl}\n` +
    `  ✅ Should be: ${new URL(appUrl).origin}`
  );
  result.valid = false;
} else {
  console.log(`  ✅ Valid: ${appUrl}`);
}

// 3. Validate AUTH_SECRET
console.log('\n📋 Checking AUTH_SECRET...');
const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  result.errors.push('AUTH_SECRET is not set');
  result.valid = false;
} else if (authSecret === 'your_generated_secret_here') {
  result.errors.push('AUTH_SECRET is using the default placeholder value');
  result.valid = false;
} else if (authSecret.length < 32) {
  result.warnings.push('AUTH_SECRET is shorter than recommended (32+ characters)');
} else {
  console.log('  ✅ Valid');
}

// 4. Validate DATABASE_URL
console.log('\n📋 Checking DATABASE_URL...');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  result.errors.push('DATABASE_URL is not set');
  result.valid = false;
} else if (databaseUrl.includes('user:password@host')) {
  result.errors.push('DATABASE_URL is using placeholder values');
  result.valid = false;
} else {
  console.log('  ✅ Valid');
}

// 5. Validate AUTH_TRUST_HOST for production
console.log('\n📋 Checking AUTH_TRUST_HOST...');
const authTrustHost = process.env.AUTH_TRUST_HOST;

if (process.env.NODE_ENV === 'production' && authTrustHost !== 'true') {
  result.warnings.push(
    'AUTH_TRUST_HOST should be set to "true" in production\n' +
    '  This is required for NextAuth to work correctly behind proxies'
  );
} else if (authTrustHost === 'true') {
  console.log('  ✅ Valid');
} else {
  console.log('  ℹ️  Not set (OK for development)');
}

// 6. Check URL consistency
console.log('\n📋 Checking URL consistency...');
if (authUrl && appUrl && isValidUrl(authUrl) && isValidUrl(appUrl)) {
  const authOrigin = new URL(authUrl).origin;
  const appOrigin = new URL(appUrl).origin;
  
  if (authOrigin !== appOrigin) {
    result.warnings.push(
      `AUTH_URL and NEXT_PUBLIC_APP_URL have different origins:\n` +
      `  AUTH_URL: ${authOrigin}\n` +
      `  NEXT_PUBLIC_APP_URL: ${appOrigin}\n` +
      `  These should typically match`
    );
  } else {
    console.log('  ✅ URLs are consistent');
  }
}

// 7. Validate R2 Storage (if configured)
console.log('\n📋 Checking R2 Storage configuration...');
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;

if (r2AccountId || r2AccessKey || r2SecretKey || r2BucketName) {
  // If any R2 variable is set, all should be set
  if (!r2AccountId) result.warnings.push('R2_ACCOUNT_ID is not set');
  if (!r2AccessKey) result.warnings.push('R2_ACCESS_KEY_ID is not set');
  if (!r2SecretKey) result.warnings.push('R2_SECRET_ACCESS_KEY is not set');
  if (!r2BucketName) result.warnings.push('R2_BUCKET_NAME is not set');
  
  if (r2AccountId && r2AccessKey && r2SecretKey && r2BucketName) {
    console.log('  ✅ All R2 variables are set');
  }
} else {
  console.log('  ℹ️  R2 Storage not configured (optional)');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(60));

if (result.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  result.errors.forEach((error, index) => {
    console.log(`\n${index + 1}. ${error}`);
  });
}

if (result.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  result.warnings.forEach((warning, index) => {
    console.log(`\n${index + 1}. ${warning}`);
  });
}

if (result.valid && result.warnings.length === 0) {
  console.log('\n✅ All environment variables are valid!');
} else if (result.valid) {
  console.log('\n✅ Environment variables are valid (with warnings)');
} else {
  console.log('\n❌ Environment validation failed!');
  console.log('\nPlease fix the errors above before deploying.');
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(result.valid ? 0 : 1);
