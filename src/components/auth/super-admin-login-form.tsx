"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2, Shield } from "lucide-react"

/**
 * Super Admin Login Form Component
 * 
 * Uses NextAuth's signIn function for super admin authentication.
 */

export function SuperAdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")

  // Check for URL parameters
  const sessionExpired = searchParams.get("session_expired") === "true"
  const accessDenied = searchParams.get("access_denied") === "true"
  const error = searchParams.get("error")

  // Clear errors when user types
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setServerError("")
  }

  // Validate form
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
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Use NextAuth's signIn function
      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        // Handle NextAuth errors
        switch (result.error) {
          case 'CredentialsSignin':
            setServerError("Invalid email or password")
            break
          case 'AccessDenied':
            setServerError("Access denied. Super admin privileges required.")
            break
          default:
            setServerError(result.error || "Authentication failed")
        }
      } else if (result?.ok) {
        // Authentication successful - redirect to super admin dashboard
        router.push('/super-admin')
        router.refresh()
      }
    } catch (error) {
      console.error('Super admin authentication error:', error)
      setServerError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm border-slate-200">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-slate-900 rounded-full w-fit">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-slate-900">Super Admin Login</CardTitle>
        <CardDescription className="text-slate-600">
          Secure access to system administration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Expired Alert */}
          {sessionExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your session has expired. Please sign in again.
              </AlertDescription>
            </Alert>
          )}

          {/* Access Denied Alert */}
          {accessDenied && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Access denied. Super admin privileges required.
              </AlertDescription>
            </Alert>
          )}

          {/* NextAuth Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error === 'CredentialsSignin' ? 'Invalid email or password' : error}
              </AlertDescription>
            </Alert>
          )}

          {/* Server Error */}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              className={errors.email ? "border-red-500" : ""}
              autoComplete="email"
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="current-password"
                required
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

          {/* Security Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-600">
                <p className="font-medium mb-1">Enhanced Security</p>
                <p>This login is monitored and logged. Unauthorized access attempts will be reported.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-slate-600">
          Regular user?{" "}
          <Link href="/login" className="text-slate-900 hover:underline font-medium">
            Sign in here
          </Link>
        </div>
        <div className="text-xs text-center text-slate-500">
          Protected by advanced security measures
        </div>
      </CardFooter>
    </Card>
  )
}