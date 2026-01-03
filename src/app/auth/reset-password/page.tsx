'use client';

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Password Reset Page
 * 
 * Allows users to reset their password using a valid reset token
 * Requirements: 11.3, 11.4, 11.8, 15.4
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <ResetPasswordForm />
    </div>
  );
}
