"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Shield, AlertCircle, Check, X } from "lucide-react";
import { changePassword } from "@/lib/actions/parent-settings-actions";
import { TwoFactorSettings } from "@/components/shared/settings/two-factor-settings";
import { toast } from "react-hot-toast";

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label = "Weak";
    let color = "text-destructive";

    if (score >= 5) {
      label = "Strong";
      color = "text-green-600";
    } else if (score >= 3) {
      label = "Medium";
      color = "text-yellow-600";
    }

    return { score, label, color, checks };
  };

  const passwordStrength = formData.newPassword ? calculatePasswordStrength(formData.newPassword) : null;

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "currentPassword":
        if (!value) return "Current password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        break;
      case "newPassword":
        if (!value) return "New password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (value.length > 100) return "Password must be less than 100 characters";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number";
        if (!/[^A-Za-z0-9]/.test(value)) return "Password must contain at least one special character";
        if (value === formData.currentPassword) return "New password must be different from current password";
        break;
      case "confirmPassword":
        if (!value) return "Please confirm your new password";
        if (value !== formData.newPassword) return "Passwords do not match";
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const currentPasswordError = validateField("currentPassword", formData.currentPassword);
    if (currentPasswordError) newErrors.currentPassword = currentPasswordError;

    const newPasswordError = validateField("newPassword", formData.newPassword);
    if (newPasswordError) newErrors.newPassword = newPasswordError;

    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Re-validate confirm password when new password changes
    if (name === "newPassword" && formData.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword);
      if (confirmError) {
        setErrors({ ...errors, confirmPassword: confirmError });
      } else {
        setErrors({ ...errors, confirmPassword: undefined });
      }
    }
  };

  const handleBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting");
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (result.success) {
        toast.success(result.message || "Your password has been changed successfully");
        // Clear form and errors on success
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setErrors({});
      } else {
        toast.error(result.message || "Unable to change your password. Please check your current password and try again.");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("An unexpected error occurred. Please try again or contact support if the problem persists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <TwoFactorSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Current Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
                onBlur={(e) => handleBlur("currentPassword", e.target.value)}
                className={errors.currentPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Enter current password"
                disabled={loading}
                aria-invalid={!!errors.currentPassword}
                aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              />
              {errors.currentPassword && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="currentPassword-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.currentPassword}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleFieldChange("newPassword", e.target.value)}
                onBlur={(e) => handleBlur("newPassword", e.target.value)}
                className={errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Enter new password"
                disabled={loading}
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? "newPassword-error newPassword-requirements" : "newPassword-requirements"}
              />
              {errors.newPassword && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="newPassword-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.newPassword}</span>
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {formData.newPassword && passwordStrength && (
                <div className="space-y-2 pt-2" id="newPassword-requirements">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Password Strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score
                            ? passwordStrength.score >= 5
                              ? "bg-green-600"
                              : passwordStrength.score >= 3
                              ? "bg-yellow-600"
                              : "bg-destructive"
                            : "bg-muted"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.length ? (
                        <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={passwordStrength.checks.length ? "text-green-600" : "text-muted-foreground"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.uppercase ? (
                        <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={passwordStrength.checks.uppercase ? "text-green-600" : "text-muted-foreground"}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.lowercase ? (
                        <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={passwordStrength.checks.lowercase ? "text-green-600" : "text-muted-foreground"}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.number ? (
                        <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={passwordStrength.checks.number ? "text-green-600" : "text-muted-foreground"}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.special ? (
                        <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={passwordStrength.checks.special ? "text-green-600" : "text-muted-foreground"}>
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Confirm new password"
                disabled={loading}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="confirmPassword-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information
          </CardTitle>
          <CardDescription>
            Keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Security Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use a strong, unique password</li>
                  <li>Never share your password with anyone</li>
                  <li>Change your password regularly</li>
                  <li>Log out from shared devices</li>
                  <li>Enable two-factor authentication if available</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Login History</span>
              <Button variant="outline" size="sm" disabled>
                View History
              </Button>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <Button variant="outline" size="sm" disabled>
                Manage Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
