import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

/**
 * Hashes a password using bcrypt
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a password against a hash
 * @param password - The plaintext password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Validates password strength according to security requirements
 * @param password - The password to validate
 * @returns Object containing validation result and any error messages
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
