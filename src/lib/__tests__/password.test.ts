/**
 * Unit Tests for Password Utilities
 * 
 * Tests password hashing, verification, and strength validation
 * Validates Requirements 3.2, 3.4, 4.2, 18.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Bcrypt includes a salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should produce bcrypt-formatted hash', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should reject password with slight variation', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('TestPassword123', hash); // Missing !
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecial123');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should accept password with various special characters', () => {
      const passwords = [
        'Password123!',
        'Password123@',
        'Password123#',
        'Password123$',
        'Password123%',
        'Password123^',
        'Password123&',
        'Password123*'
      ];

      passwords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Property 1: Password Hashing Security', () => {
    it('should hash passwords securely and verify correctly', async () => {
      // Feature: clerk-to-nextauth-migration, Property 1
      // Validates: Requirements 3.4, 4.2
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 100 }),
          async (password) => {
            const hash = await hashPassword(password);
            
            // Hash should be different from password
            expect(hash).not.toBe(password);
            
            // Hash should verify correctly
            const isValid = await verifyPassword(password, hash);
            expect(isValid).toBe(true);
            
            // Wrong password should not verify
            const isInvalid = await verifyPassword(password + 'wrong', hash);
            expect(isInvalid).toBe(false);
          }
        ),
        { numRuns: 10 } // Reduced from 100 due to bcrypt performance
      );
    }, 30000); // 30 second timeout for bcrypt operations
  });

  describe('Property 6: Password Strength Validation', () => {
    it('should reject passwords not meeting strength requirements', () => {
      // Feature: clerk-to-nextauth-migration, Property 6
      // Validates: Requirements 3.2
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 7 }), // Too short
            fc.string({ minLength: 8, maxLength: 100 }).filter(s => !/[A-Z]/.test(s)), // No uppercase
            fc.string({ minLength: 8, maxLength: 100 }).filter(s => !/[a-z]/.test(s)), // No lowercase
            fc.string({ minLength: 8, maxLength: 100 }).filter(s => !/[0-9]/.test(s)), // No number
            fc.string({ minLength: 8, maxLength: 100 }).filter(s => !/[^A-Za-z0-9]/.test(s)) // No special char
          ),
          (weakPassword) => {
            const result = validatePasswordStrength(weakPassword);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
