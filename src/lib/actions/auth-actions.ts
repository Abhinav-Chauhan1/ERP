"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/utils/rate-limit";

interface ChangePasswordParams {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

interface LoginParams {
  email: string;
  password: string;
  totpCode?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  requiresTwoFactor?: boolean;
  redirectUrl?: string;
  code?: string;
  retryAfter?: number;
}

/**
 * Login action with rate limiting
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.8, 4.9
 */
export async function loginAction({
  email,
  password,
  totpCode,
}: LoginParams): Promise<LoginResult> {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Create a rate limiter specifically for login attempts
    // 5 attempts per 15 minutes per IP
    const loginRateLimitKey = `login:${clientIp}`;

    // Check rate limit using in-memory tracking
    const rateLimitResult = await checkLoginRateLimit(loginRateLimitKey);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60);
      return {
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfter * 60,
        error: `Too many login attempts. Please try again in ${retryAfter} minute${retryAfter !== 1 ? 's' : ''}.`
      };
    }

    // Attempt sign in
    const result = await signIn("credentials", {
      email,
      password,
      totpCode,
      redirect: false,
    });

    // If sign in failed, increment failed attempts
    if (result?.error) {
      await incrementLoginAttempts(loginRateLimitKey);

      // Handle specific error cases
      switch (result.error) {
        case "2FA_REQUIRED":
          return {
            success: false,
            requiresTwoFactor: true,
            error: "Please enter your two-factor authentication code"
          };
        case "INVALID_2FA_CODE":
          return {
            success: false,
            error: "Invalid two-factor authentication code. Please try again."
          };
        case "EMAIL_NOT_VERIFIED":
          return {
            success: false,
            error: "Please verify your email before logging in. Check your inbox for the verification link."
          };
        case "ACCOUNT_INACTIVE":
          return {
            success: false,
            error: "Your account has been deactivated. Please contact support for assistance."
          };
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password. Please try again."
          };
        default:
          return {
            success: false,
            error: "An error occurred during login. Please try again."
          };
      }
    }

    // Success - clear rate limit attempts
    await clearLoginAttempts(loginRateLimitKey);

    // Get user to determine redirect URL
    const user = await db.user.findUnique({
      where: { email },
      select: { role: true }
    });

    let redirectUrl = "/";
    if (user?.role) {
      switch (user.role) {
        case "ADMIN":
          redirectUrl = "/admin";
          break;
        case "TEACHER":
          redirectUrl = "/teacher";
          break;
        case "STUDENT":
          redirectUrl = "/student";
          break;
        case "PARENT":
          redirectUrl = "/parent";
          break;
      }
    }

    return {
      success: true,
      redirectUrl
    };
  } catch (error: any) {
    console.error("Login action error:", error);

    // Handle Auth.js errors that are thrown
    if (error?.type === "CallbackRouteError" || error?.name === "CallbackRouteError") {
      const errorCode = error.cause?.err?.message || error.cause?.message;

      switch (errorCode) {
        case "2FA_REQUIRED":
          return {
            success: false,
            requiresTwoFactor: true,
            error: "Please enter your two-factor authentication code"
          };
        case "INVALID_2FA_CODE":
          return {
            success: false,
            error: "Invalid two-factor authentication code. Please try again."
          };
        case "EMAIL_NOT_VERIFIED":
          return {
            success: false,
            error: "Please verify your email before logging in. Check your inbox for the verification link."
          };
        case "ACCOUNT_INACTIVE":
          return {
            success: false,
            error: "Your account has been deactivated. Please contact support for assistance."
          };
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password. Please try again."
          };
      }
    }

    // Handle string errors (sometimes thrown directly)
    if (typeof error?.message === "string") {
      if (error.message.includes("CredentialsSignin")) {
        return {
          success: false,
          error: "Invalid email or password. Please try again."
        };
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again."
    };
  }
}

// In-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

async function checkLoginRateLimit(key: string): Promise<{ allowed: boolean; resetTime: number }> {
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return { allowed: true, resetTime: now + windowMs };
  }

  // Check if window has expired
  if (now > attempt.resetTime) {
    loginAttempts.delete(key);
    return { allowed: true, resetTime: now + windowMs };
  }

  // Check if limit exceeded
  if (attempt.count >= maxAttempts) {
    return { allowed: false, resetTime: attempt.resetTime };
  }

  return { allowed: true, resetTime: attempt.resetTime };
}

async function incrementLoginAttempts(key: string): Promise<void> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + windowMs });
  } else {
    attempt.count++;
  }

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    cleanupLoginAttempts();
  }
}

async function clearLoginAttempts(key: string): Promise<void> {
  loginAttempts.delete(key);
}

function cleanupLoginAttempts(): void {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (now > attempt.resetTime) {
      loginAttempts.delete(key);
    }
  }
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordParams) {
  try {
    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "User not found or password not set"
      };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Current password is incorrect"
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log password change
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "PASSWORD",
        resourceId: userId,
        userId,
        changes: {}
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}
