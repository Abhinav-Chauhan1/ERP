'use client';

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link
 * Requirements: 11.1, 11.2, 11.7
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <ForgotPasswordForm />
    </div>
  );
}
