'use client';

import { SuperAdminLoginForm } from "@/components/auth/super-admin-login-form";

/**
 * Super Admin Login Page
 * 
 * Dedicated secure login route for super administrators.
 * Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5
 */
export default function SuperAdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Super Admin</h1>
          <p className="text-slate-300">System Administration Portal</p>
        </div>
        <SuperAdminLoginForm />
      </div>
    </div>
  );
}