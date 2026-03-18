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
import Image from "next/image"
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, School } from "lucide-react"

/**
 * Unified Login Form Component
 *
 * All user types (admin, teacher, student, parent) authenticate with
 * mobile/email + password. OTP flow has been removed.
 */

interface SchoolInfo {
  id: string
  name: string
  schoolCode: string
  logo?: string | null
}

type AuthStep = "school" | "identifier" | "credentials"

export function UnifiedLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentStep, setCurrentStep] = useState<AuthStep>("school")
  const [formData, setFormData] = useState({
    schoolCode: "",
    identifier: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [validatedSchool, setValidatedSchool] = useState<SchoolInfo | null>(null)

  const sessionExpired = searchParams.get("session_expired") === "true"
  const registered = searchParams.get("registered") === "true"
  const verified = searchParams.get("verified") === "true"
  const error = searchParams.get("error")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
    setServerError("")
  }

  // Step 1: Validate school code
  const handleSchoolCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setErrors({})

    if (!formData.schoolCode.trim()) {
      setErrors({ schoolCode: "School code is required" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/schools/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode: formData.schoolCode.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setValidatedSchool(data.school)
        setCurrentStep("identifier")
      } else {
        setErrors({ schoolCode: "Invalid school code. Please check and try again." })
      }
    } catch {
      setServerError("Unable to validate school code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Accept identifier (mobile or email)
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setErrors({})

    const identifier = formData.identifier.trim()
    if (!identifier) {
      setErrors({ identifier: "Mobile number or email is required" })
      return
    }

    const isEmail = identifier.includes("@")
    const isMobile = /^\d{10}$/.test(identifier)

    if (!isEmail && !isMobile) {
      setErrors({ identifier: "Please enter a valid mobile number (10 digits) or email address" })
      return
    }

    setCurrentStep("credentials")
  }

  // Step 3: Submit credentials
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setErrors({})

    if (!formData.password.trim()) {
      setErrors({ password: "Password is required" })
      return
    }

    setIsLoading(true)
    try {
      const identifier = formData.identifier.trim()
      const isEmail = identifier.includes("@")

      const result = await signIn("credentials", {
        email: isEmail ? identifier : undefined,
        mobile: !isEmail ? identifier : undefined,
        password: formData.password,
        schoolCode: formData.schoolCode,
        redirect: false,
      })

      if (result?.error) {
        switch (result.error) {
          case "EMAIL_NOT_VERIFIED":
            setServerError("Please verify your email address before signing in.")
            break
          case "2FA_REQUIRED":
            setServerError("Two-factor authentication is required.")
            break
          case "INVALID_2FA_CODE":
            setServerError("Invalid 2FA code. Please try again.")
            break
          case "CredentialsSignin":
            setServerError("Invalid credentials. Please check and try again.")
            break
          default:
            setServerError(result.error || "Authentication failed")
        }
      } else if (result?.ok) {
        window.location.href = "/dashboard"
      }
    } catch {
      setServerError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderSchoolStep = () => (
    <form onSubmit={handleSchoolCodeSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <School className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <h2 className="text-lg font-semibold">Enter School Code</h2>
        <p className="text-sm text-gray-600">Please enter your school code to continue</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="schoolCode">School Code</Label>
        <Input
          id="schoolCode"
          type="text"
          placeholder="Enter your school code"
          value={formData.schoolCode}
          onChange={(e) => handleInputChange("schoolCode", e.target.value.toUpperCase())}
          disabled={isLoading}
          className={errors.schoolCode ? "border-red-500" : ""}
          autoComplete="off"
        />
        {errors.schoolCode && <p className="text-sm text-red-500">{errors.schoolCode}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validating...</> : "Continue"}
      </Button>
    </form>
  )

  const renderSchoolBadge = () => (
    <div className="flex flex-col items-center mb-6">
      {validatedSchool?.logo ? (
        <Image
          src={validatedSchool.logo}
          alt={validatedSchool.name}
          width={72}
          height={72}
          className="rounded-full object-contain mb-2 border border-gray-200 bg-white p-1"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-2 border border-blue-100">
          <School className="h-8 w-8 text-blue-600" />
        </div>
      )}
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">{validatedSchool?.name}</span>
      </div>
    </div>
  )

  const renderIdentifierStep = () => (
    <form onSubmit={handleIdentifierSubmit} className="space-y-4">
      <div className="text-center mb-6">
        {renderSchoolBadge()}
        <h2 className="text-lg font-semibold">Enter Your Details</h2>
        <p className="text-sm text-gray-600">Enter your mobile number or email address</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifier">Mobile Number or Email</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="Mobile number or email address"
          value={formData.identifier}
          onChange={(e) => handleInputChange("identifier", e.target.value)}
          disabled={isLoading}
          className={errors.identifier ? "border-red-500" : ""}
          autoComplete="username"
        />
        {errors.identifier && <p className="text-sm text-red-500">{errors.identifier}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setCurrentStep("school")} disabled={isLoading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          Continue
        </Button>
      </div>
    </form>
  )

  const renderCredentialsStep = () => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
      <div className="text-center mb-6">
        {renderSchoolBadge()}
        <h2 className="text-lg font-semibold">Enter Password</h2>
        <p className="text-sm text-gray-600">Enter your password to continue</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={isLoading}
            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setCurrentStep("identifier")} disabled={isLoading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : "Sign In"}
        </Button>
      </div>
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Access your school dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Your session has expired. Please sign in again.</AlertDescription>
          </Alert>
        )}
        {registered && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Registration successful! You can now sign in.
            </AlertDescription>
          </Alert>
        )}
        {verified && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Email verified successfully! You can now sign in.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === "CredentialsSignin" ? "Invalid credentials. Please try again." : error}
            </AlertDescription>
          </Alert>
        )}
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {currentStep === "school" && renderSchoolStep()}
        {currentStep === "identifier" && renderIdentifierStep()}
        {currentStep === "credentials" && renderCredentialsStep()}
      </CardContent>

      {currentStep === "school" && (
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            Super Admin?{" "}
            <Link href="/sd" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
