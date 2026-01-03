"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { validatePasswordStrength } from "@/lib/password"
import { 
  AuthErrorCode, 
  getErrorMessage 
} from "@/lib/auth-errors"

/**
 * Reset Password Form Component
 * 
 * Allows users to reset their password using a valid reset token
 * Requirements: 11.3, 11.4, 11.8, 15.4
 */
export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean
    errors: string[]
  }>({ valid: false, errors: [] })

  // Validate token on mount (Requirement 11.3)
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setIsValidating(false)
        setServerError(getErrorMessage(AuthErrorCode.INVALID_TOKEN))
        return
      }

      try {
        // Validate token by checking if it exists and hasn't expired
        const response = await fetch("/api/auth/validate-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (data.success) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          // Use error code if available
          if (data.code === AuthErrorCode.EXPIRED_TOKEN) {
            setServerError(getErrorMessage(AuthErrorCode.EXPIRED_TOKEN))
          } else if (data.code === AuthErrorCode.TOKEN_ALREADY_USED) {
            setServerError(getErrorMessage(AuthErrorCode.TOKEN_ALREADY_USED))
          } else {
            setServerError(data.error || getErrorMessage(AuthErrorCode.INVALID_TOKEN))
          }
        }
      } catch (error) {
        console.error("Token validation error:", error)
        setTokenValid(false)
        setServerError(getErrorMessage(AuthErrorCode.INTERNAL_ERROR))
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  // Update password strength indicator as user types
  useEffect(() => {
    if (formData.password) {
      const strength = validatePasswordStrength(formData.password)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength({ valid: false, errors: [] })
    }
  }, [formData.password])

  // Client-side validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Password validation (Requirement 11.4)
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else {
      const strength = validatePasswordStrength(formData.password)
      if (!strength.valid) {
        newErrors.password = "Password does not meet requirements"
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call reset password API
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!data.success) {
        // Use error code if available
        if (data.code === AuthErrorCode.EXPIRED_TOKEN) {
          setServerError(getErrorMessage(AuthErrorCode.EXPIRED_TOKEN))
        } else if (data.code === AuthErrorCode.INVALID_TOKEN) {
          setServerError(getErrorMessage(AuthErrorCode.INVALID_TOKEN))
        } else if (data.code === AuthErrorCode.TOKEN_ALREADY_USED) {
          setServerError(getErrorMessage(AuthErrorCode.TOKEN_ALREADY_USED))
        } else if (data.code === AuthErrorCode.WEAK_PASSWORD) {
          setServerError(getErrorMessage(AuthErrorCode.WEAK_PASSWORD))
        } else {
          setServerError(data.error || getErrorMessage(AuthErrorCode.VALIDATION_ERROR))
        }
        setIsLoading(false)
        return
      }

      // Success
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?password_reset=true")
      }, 3000)
    } catch (error) {
      console.error("Password reset error:", error)
      setServerError(getErrorMessage(AuthErrorCode.INTERNAL_ERROR))
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Show loading state while validating token
  if (isValidating) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Validating reset token...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error if token is invalid (Requirement 11.8)
  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Invalid Reset Link
          </CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Password reset links expire after 1 hour for security reasons.
            </p>
            <p className="text-sm text-gray-600">
              Please request a new password reset link to continue.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">
              Request New Reset Link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Show success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Password Reset Successful
          </CardTitle>
          <CardDescription>
            Your password has been reset successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your password has been updated. You can now log in with your new password.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Redirecting to login page...
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Show password reset form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Error */}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Password Requirements:</p>
                <ul className="text-xs space-y-1">
                  <li className={formData.password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                    {formData.password.length >= 8 ? "✓" : "○"} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-gray-500"}>
                    {/[A-Z]/.test(formData.password) ? "✓" : "○"} One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? "text-green-600" : "text-gray-500"}>
                    {/[a-z]/.test(formData.password) ? "✓" : "○"} One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? "text-green-600" : "text-gray-500"}>
                    {/[0-9]/.test(formData.password) ? "✓" : "○"} One number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : "text-gray-500"}>
                    {/[^A-Za-z0-9]/.test(formData.password) ? "✓" : "○"} One special character
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !passwordStrength.valid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Back to Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
