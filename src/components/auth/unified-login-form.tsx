"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Clock, School, User, Smartphone, Lock } from "lucide-react"
// Remove direct service imports - we'll use API endpoints instead
import { UserRole } from "@prisma/client"

/**
 * Unified Login Form Component
 * 
 * Provides unified authentication for all school-based user types with:
 * - School code validation and context loading
 * - Role-based authentication method determination
 * - OTP input for students and parents
 * - Password input for teachers and admins
 * - Multi-school and multi-child context management
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

interface School {
  id: string
  name: string
  schoolCode: string
}

interface AuthStep {
  step: 'school' | 'identifier' | 'credentials' | 'school-selection' | 'child-selection'
  data?: any
}

export function UnifiedLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Form state
  const [currentStep, setCurrentStep] = useState<AuthStep>({ step: 'school' })
  const [formData, setFormData] = useState({
    schoolCode: "",
    identifier: "", // mobile or email
    password: "",
    otpCode: "",
    selectedSchoolId: "",
    selectedChildId: ""
  })
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  
  // Context state
  const [validatedSchool, setValidatedSchool] = useState<School | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [authMethod, setAuthMethod] = useState<'otp' | 'password' | null>(null)
  const [availableSchools, setAvailableSchools] = useState<School[]>([])
  const [availableChildren, setAvailableChildren] = useState<any[]>([])
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null)
  const [otpCountdown, setOtpCountdown] = useState<number>(0)

  // Check for URL parameters
  const sessionExpired = searchParams.get("session_expired") === "true"
  const registered = searchParams.get("registered") === "true"
  const verified = searchParams.get("verified") === "true"

  // OTP countdown timer
  useEffect(() => {
    if (otpExpiresAt && otpCountdown > 0) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiresAt.getTime() - Date.now()) / 1000))
        setOtpCountdown(remaining)
        if (remaining === 0) {
          setOtpSent(false)
          setOtpExpiresAt(null)
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpExpiresAt, otpCountdown])

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

  // Step 1: School Code Validation
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
      const response = await fetch('/api/auth/school-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolCode: formData.schoolCode.trim()
        }),
      })

      const data = await response.json()
      
      if (!data.success) {
        if (response.status === 404) {
          setErrors({ schoolCode: "Invalid school code. Please check and try again." })
        } else if (response.status === 403) {
          setServerError("This school is currently inactive. Please contact support.")
        } else {
          setServerError(data.error || "Unable to validate school code. Please try again.")
        }
        setIsLoading(false)
        return
      }

      setValidatedSchool(data.school)
      setCurrentStep({ step: 'identifier' })
    } catch (error: any) {
      console.error('School validation error:', error)
      setServerError("Unable to validate school code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Identifier Submission (determines auth method)
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setErrors({})

    if (!formData.identifier.trim()) {
      setErrors({ identifier: "Mobile number or email is required" })
      return
    }

    // Basic validation
    const identifier = formData.identifier.trim()
    const isEmail = identifier.includes('@')
    const isMobile = /^\d{10}$/.test(identifier)

    if (!isEmail && !isMobile) {
      setErrors({ identifier: "Please enter a valid mobile number (10 digits) or email address" })
      return
    }

    setIsLoading(true)

    try {
      // Generate OTP first to determine if user exists and get role
      const response = await fetch('/api/auth/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier,
          schoolId: validatedSchool?.id
        }),
      })

      const data = await response.json()
      
      if (!data.success) {
        if (data.code === 'USER_NOT_FOUND') {
          setErrors({ identifier: "No account found with this mobile number or email for the selected school" })
        } else if (data.code === 'RATE_LIMITED') {
          setServerError("Too many OTP requests. Please wait before trying again.")
        } else {
          setServerError(data.error || "Failed to send OTP")
        }
        setIsLoading(false)
        return
      }

      // For now, we'll determine auth method based on identifier type
      // In a real implementation, you'd query the user's role from the database
      // Students and parents use OTP, teachers and admins can use both
      const determinedAuthMethod = isEmail ? 'password' : 'otp'
      
      setAuthMethod(determinedAuthMethod)
      
      if (determinedAuthMethod === 'otp') {
        setOtpSent(true)
        setOtpExpiresAt(data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 5 * 60 * 1000))
        setOtpCountdown(300) // 5 minutes
      }
      
      setCurrentStep({ step: 'credentials' })
    } catch (error) {
      console.error('Identifier submission error:', error)
      setServerError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Credentials Submission (OTP or Password)
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    setErrors({})

    // Validate credentials based on auth method
    if (authMethod === 'otp' && !formData.otpCode.trim()) {
      setErrors({ otpCode: "OTP code is required" })
      return
    }

    if (authMethod === 'password' && !formData.password.trim()) {
      setErrors({ password: "Password is required" })
      return
    }

    setIsLoading(true)

    try {
      const credentials = {
        type: authMethod!,
        value: authMethod === 'otp' ? formData.otpCode : formData.password
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          schoolId: validatedSchool!.id,
          credentials
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setServerError(data.error || "Authentication failed")
        setIsLoading(false)
        return
      }

      // Handle multi-school selection
      if (data.requiresSchoolSelection && data.availableSchools) {
        setAvailableSchools(data.availableSchools)
        setCurrentStep({ step: 'school-selection' })
        setIsLoading(false)
        return
      }

      // Handle multi-child selection (for parents)
      if (data.requiresChildSelection && data.availableChildren) {
        setAvailableChildren(data.availableChildren)
        setCurrentStep({ step: 'child-selection' })
        setIsLoading(false)
        return
      }

      // Authentication successful - redirect to appropriate dashboard
      if (data.token && data.user) {
        // Store token in localStorage or cookie
        localStorage.setItem('auth_token', data.token)
        
        // Redirect to the provided URL or default route
        const redirectUrl = data.redirectUrl || '/dashboard'
        router.push(redirectUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setServerError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle school selection for multi-school users
  const handleSchoolSelection = async (schoolId: string) => {
    setFormData(prev => ({ ...prev, selectedSchoolId: schoolId }))
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setServerError("Session expired. Please sign in again.")
        return
      }

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newSchoolId: schoolId,
          token
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setServerError(data.error || "Failed to switch school context")
        return
      }

      // Redirect to the provided URL
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('School selection error:', error)
      setServerError("Failed to switch school context. Please try again.")
    }
  }

  // Handle child selection for parents
  const handleChildSelection = async (childId: string) => {
    setFormData(prev => ({ ...prev, selectedChildId: childId }))
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setServerError("Session expired. Please sign in again.")
        return
      }

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStudentId: childId,
          token
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setServerError(data.error || "Failed to switch child context")
        return
      }

      // Redirect to the provided URL
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Child selection error:', error)
      setServerError("Failed to switch child context. Please try again.")
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (!formData.identifier || !validatedSchool) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          schoolId: validatedSchool.id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setOtpSent(true)
        setOtpExpiresAt(data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 5 * 60 * 1000))
        setOtpCountdown(300)
        setServerError("")
      } else {
        setServerError(data.error || "Failed to resend OTP")
      }
    } catch (error) {
      setServerError("Failed to resend OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Render different steps
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
          name="schoolCode"
          type="text"
          placeholder="Enter your school code"
          value={formData.schoolCode}
          onChange={(e) => handleInputChange('schoolCode', e.target.value.toUpperCase())}
          disabled={isLoading}
          className={errors.schoolCode ? "border-red-500" : ""}
          autoComplete="off"
        />
        {errors.schoolCode && (
          <p className="text-sm text-red-500">{errors.schoolCode}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  )

  const renderIdentifierStep = () => (
    <form onSubmit={handleIdentifierSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-600 font-medium">{validatedSchool?.name}</span>
        </div>
        <User className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <h2 className="text-lg font-semibold">Enter Your Details</h2>
        <p className="text-sm text-gray-600">Enter your mobile number or email address</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier">Mobile Number or Email</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          placeholder="Mobile number or email address"
          value={formData.identifier}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
          disabled={isLoading}
          className={errors.identifier ? "border-red-500" : ""}
          autoComplete="username"
        />
        {errors.identifier && (
          <p className="text-sm text-red-500">{errors.identifier}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep({ step: 'school' })}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </form>
  )

  const renderCredentialsStep = () => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-600 font-medium">{validatedSchool?.name}</span>
        </div>
        {authMethod === 'otp' ? (
          <Smartphone className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        ) : (
          <Lock className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        )}
        <h2 className="text-lg font-semibold">
          {authMethod === 'otp' ? 'Enter OTP' : 'Enter Password'}
        </h2>
        <p className="text-sm text-gray-600">
          {authMethod === 'otp' 
            ? `OTP sent to ${formData.identifier}`
            : 'Enter your password to continue'
          }
        </p>
      </div>

      {authMethod === 'otp' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="otpCode">OTP Code</Label>
            {otpCountdown > 0 && (
              <span className="text-xs text-gray-500">
                Expires in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <Input
            id="otpCode"
            name="otpCode"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={formData.otpCode}
            onChange={(e) => handleInputChange('otpCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading}
            className={errors.otpCode ? "border-red-500" : ""}
            maxLength={6}
            autoComplete="one-time-code"
          />
          {errors.otpCode && (
            <p className="text-sm text-red-500">{errors.otpCode}</p>
          )}
          
          {!otpSent || otpCountdown === 0 ? (
            <Button
              type="button"
              variant="link"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="p-0 h-auto text-sm"
            >
              Resend OTP
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep({ step: 'identifier' })}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </div>
    </form>
  )

  const renderSchoolSelectionStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <School className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <h2 className="text-lg font-semibold">Select School</h2>
        <p className="text-sm text-gray-600">You have access to multiple schools. Please select one to continue.</p>
      </div>

      <div className="space-y-2">
        {availableSchools.map((school) => (
          <Button
            key={school.id}
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleSchoolSelection(school.id)}
          >
            <div className="text-left">
              <div className="font-medium">{school.name}</div>
              <div className="text-sm text-gray-500">Code: {school.schoolCode}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )

  const renderChildSelectionStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <h2 className="text-lg font-semibold">Select Child</h2>
        <p className="text-sm text-gray-600">Please select which child's information you want to access.</p>
      </div>

      <div className="space-y-2">
        {availableChildren.map((child) => (
          <Button
            key={child.id}
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleChildSelection(child.id)}
          >
            <div className="text-left">
              <div className="font-medium">{child.name}</div>
              {child.class && child.section && (
                <div className="text-sm text-gray-500">Class: {child.class} - {child.section}</div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Access your school dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Session Expired Alert */}
        {sessionExpired && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired. Please sign in again.
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Success Alert */}
        {registered && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Registration successful! You can now sign in to your account.
            </AlertDescription>
          </Alert>
        )}

        {/* Email Verification Success Alert */}
        {verified && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Email verified successfully! You can now sign in to your account.
            </AlertDescription>
          </Alert>
        )}

        {/* Server Error */}
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Render current step */}
        {currentStep.step === 'school' && renderSchoolStep()}
        {currentStep.step === 'identifier' && renderIdentifierStep()}
        {currentStep.step === 'credentials' && renderCredentialsStep()}
        {currentStep.step === 'school-selection' && renderSchoolSelectionStep()}
        {currentStep.step === 'child-selection' && renderChildSelectionStep()}
      </CardContent>
      
      {currentStep.step === 'school' && (
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