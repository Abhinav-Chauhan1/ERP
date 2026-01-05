"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Clock } from "lucide-react"
import { loginAction } from "@/lib/actions/auth-actions"
import {
  AuthErrorCode,
  getErrorMessage,
  getRateLimitMessage,
  isRateLimitError,
  requires2FA,
  getRetryAfter
} from "@/lib/auth-errors"

/**
 * Login Form Component
 * 
 * Provides user authentication with email/password, 2FA support, and OAuth providers
 * Requirements: 15.1, 15.8, 4.1, 10.7, 10.8
 */
export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    totpCode: "",
    rememberMe: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [serverError, setServerError] = useState("")
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined)

  // Check for session expired, registered, or verified flags
  const sessionExpired = searchParams.get("session_expired") === "true"
  const registered = searchParams.get("registered") === "true"
  const verified = searchParams.get("verified") === "true"
  const passwordReset = searchParams.get("password_reset") === "true"

  // Client-side validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    // 2FA code validation (if 2FA is shown)
    if (show2FA && !formData.totpCode) {
      newErrors.totpCode = "2FA code is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setRetryAfter(undefined)

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call login action with rate limiting
      const result = await loginAction({
        email: formData.email,
        password: formData.password,
        totpCode: formData.totpCode || undefined
      })

      if (!result.success) {
        // Handle 2FA requirement
        if (result.requiresTwoFactor) {
          setShow2FA(true)
          setServerError(getErrorMessage(AuthErrorCode.TWO_FA_REQUIRED))
        } else if (result.code === AuthErrorCode.RATE_LIMIT_EXCEEDED && result.retryAfter) {
          // Handle rate limiting with retry time
          setRetryAfter(result.retryAfter)
          setServerError(getRateLimitMessage(result.retryAfter))
        } else if (result.code) {
          // Use error code to get user-friendly message
          setServerError(getErrorMessage(result.code as AuthErrorCode, result.error))
        } else {
          setServerError(result.error || "An error occurred during login")
        }

        setIsLoading(false)
        return
      }

      // Success - redirect to appropriate dashboard
      if (result.redirectUrl) {
        router.push(result.redirectUrl)
        router.refresh()
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setServerError(getErrorMessage(AuthErrorCode.INTERNAL_ERROR))
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access SikshaMitra
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Expired Alert */}
          {sessionExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(AuthErrorCode.SESSION_EXPIRED)}
              </AlertDescription>
            </Alert>
          )}

          {/* Registration Success Alert */}
          {registered && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registration successful! Please check your email to verify your account before logging in.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Verification Success Alert */}
          {verified && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email verified successfully! You can now log in to your account.
              </AlertDescription>
            </Alert>
          )}

          {/* Password Reset Success Alert */}
          {passwordReset && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password reset successful! You can now log in with your new password.
              </AlertDescription>
            </Alert>
          )}


          {/* Server Error with Rate Limit Info */}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>{serverError}</p>
                  {retryAfter && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>Please wait {Math.ceil(retryAfter / 60)} minute{Math.ceil(retryAfter / 60) > 1 ? 's' : ''} before trying again.</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}


          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? "border-red-500" : ""}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
                tabIndex={-1}
              >
                Forgot password?
              </Link>
            </div>
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
                autoComplete="current-password"
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
          </div>

          {/* 2FA Code (conditional) */}
          {show2FA && (
            <div className="space-y-2">
              <Label htmlFor="totpCode">Two-Factor Authentication Code</Label>
              <Input
                id="totpCode"
                name="totpCode"
                type="text"
                placeholder="000000"
                value={formData.totpCode}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.totpCode ? "border-red-500" : ""}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {errors.totpCode && (
                <p className="text-sm text-red-500">{errors.totpCode}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app or use a backup code.
              </p>
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              Remember me
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
