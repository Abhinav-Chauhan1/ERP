'use client';

import { UnifiedLoginForm } from "@/components/auth/unified-login-form";

/**
 * Unified Login Page
 * 
 * Single login page for all school-based user types with automatic
 * authentication method determination based on role.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <UnifiedLoginForm />
    </div>
  );
}
