"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { 
  AuthErrorCode, 
  getErrorMessage 
} from "@/lib/auth-errors"

/**
 * Forgot Password Form Component
 * 
 * Allows users to request a password reset link
 * Requirements: 11.1, 11.2, 11.7
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Client-side validation
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email) {
      setError("Email is required")
      return false
    }
    
    if (!emailRegex.test(email)) {
      setError(getErrorMessage(AuthErrorCode.INVALID_EMAIL))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email
    if (!validateEmail()) {
      return
    }

    setIsLoading(true)

    try {
      // Call forgot password API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!data.success) {
        // Use error code if available
        if (data.code === AuthErrorCode.INVALID_EMAIL) {
          setError(getErrorMessage(AuthErrorCode.INVALID_EMAIL))
        } else if (data.code === AuthErrorCode.RATE_LIMIT_EXCEEDED) {
          setError(getErrorMessage(AuthErrorCode.RATE_LIMIT_EXCEEDED))
        } else {
          setError(data.error || getErrorMessage(AuthErrorCode.VALIDATION_ERROR))
        }
        setIsLoading(false)
        return
      }

      // Success - always show success message (prevents user enumeration)
      setSuccess(true)
    } catch (error) {
      console.error("Forgot password error:", error)
      setError(getErrorMessage(AuthErrorCode.INTERNAL_ERROR))
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  // Show success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Check Your Email
          </CardTitle>
          <CardDescription>
            Password reset instructions sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              If an account with that email exists, we've sent password reset instructions to <strong>{email}</strong>.
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Please check your email inbox (and spam folder) for the password reset link.
            </p>
            <p className="text-sm text-gray-600">
              The link will expire in 1 hour for security reasons.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
          <div className="text-sm text-center text-gray-600">
            Didn't receive the email?{" "}
            <button
              onClick={() => {
                setSuccess(false)
                setEmail("")
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Show forgot password form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={handleChange}
              disabled={isLoading}
              className={error ? "border-red-500" : ""}
              autoComplete="email"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
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
                Sending Reset Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
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
