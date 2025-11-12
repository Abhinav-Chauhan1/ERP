/**
 * CSRF Token Input Component
 * Hidden input field for CSRF token in forms
 */

"use client";

interface CsrfInputProps {
  token: string;
}

/**
 * Hidden input component for CSRF token
 * Include this in all forms that submit sensitive data
 */
export function CsrfInput({ token }: CsrfInputProps) {
  return (
    <input
      type="hidden"
      name="csrf_token"
      value={token}
      readOnly
      aria-hidden="true"
    />
  );
}
