"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  AlertCircle, Eye, EyeOff, Loader2,
  CheckCircle2, School, ArrowLeft, ArrowRight,
} from "lucide-react"


interface SchoolInfo {
  id: string
  name: string
  schoolCode: string
  logo?: string | null
}

type AuthStep = "school" | "identifier" | "credentials"

const STEPS: { key: AuthStep; label: string }[] = [
  { key: "school",      label: "School"   },
  { key: "identifier",  label: "Identity" },
  { key: "credentials", label: "Password" },
]

function stepIndex(s: AuthStep) {
  return STEPS.findIndex((x) => x.key === s)
}

/* ─── shared input style ─── */
const inputCls =
  "w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all " +
  "placeholder:text-slate-400 focus:bg-white focus:ring-2 "
const inputOk  = "border-slate-200 focus:border-red-500 focus:ring-red-100"
const inputErr = "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"

/* ─── small alert strip ─── */
function AlertStrip({
  type, children,
}: {
  type: "error" | "success"
  children: React.ReactNode
}) {
  const isErr = type === "error"
  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
      style={{
        background: isErr ? "#FFF1F2" : "#F0FDF4",
        border: `1px solid ${isErr ? "#FECDD3" : "#BBF7D0"}`,
        color: isErr ? "#BE123C" : "#15803D",
      }}
    >
      {isErr
        ? <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        : <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
      <span>{children}</span>
    </div>
  )
}

export function UnifiedLoginForm() {
  const searchParams = useSearchParams()

  const [currentStep, setCurrentStep]       = useState<AuthStep>("school")
  const [formData, setFormData]             = useState({ schoolCode: "", identifier: "", password: "" })
  const [errors, setErrors]                 = useState<Record<string, string>>({})
  const [isLoading, setIsLoading]           = useState(false)
  const [showPassword, setShowPassword]     = useState(false)
  const [serverError, setServerError]       = useState("")
  const [validatedSchool, setValidatedSchool] = useState<SchoolInfo | null>(null)

  const sessionExpired = searchParams.get("session_expired") === "true"
  const verified       = searchParams.get("verified")       === "true"
  const error          = searchParams.get("error")

  const cur = stepIndex(currentStep)

  function handleInput(field: string, value: string) {
    setFormData((p) => ({ ...p, [field]: value }))
    setErrors((p) => { const e = { ...p }; delete e[field]; return e })
    setServerError("")
  }

  async function handleSchoolCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setErrors({})
    if (!formData.schoolCode.trim()) {
      setErrors({ schoolCode: "School code is required" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/schools/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode: formData.schoolCode.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
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

  async function handleIdentifierSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setErrors({})
    const id = formData.identifier.trim()
    if (!id) {
      setErrors({ identifier: "Mobile number or email is required" })
      return
    }
    const isEmail  = id.includes("@")
    const isMobile = /^\d{10}$/.test(id)
    if (!isEmail && !isMobile) {
      setErrors({ identifier: "Enter a valid mobile number (10 digits) or email address" })
      return
    }
    setCurrentStep("credentials")
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setErrors({})
    if (!formData.password.trim()) {
      setErrors({ password: "Password is required" })
      return
    }
    setIsLoading(true)
    try {
      const id      = formData.identifier.trim()
      const isEmail = id.includes("@")
      const result  = await signIn("credentials", {
        email:      isEmail ? id : undefined,
        mobile:     !isEmail ? id : undefined,
        password:   formData.password,
        schoolCode: formData.schoolCode,
        redirect:   false,
      })
      if (result?.error) {
        switch (result.error) {
          case "EMAIL_NOT_VERIFIED":
            setServerError("Please verify your email address before signing in.")
            break
          case "2FA_REQUIRED":
            setServerError("Two-factor authentication is required.")
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

  /* ── Step progress bar ── */
  function StepProgress() {
    return (
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map(({ key, label }, i) => {
          const isDone   = cur > i
          const isActive = cur === i
          return (
            <div key={key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                  style={{
                    background: isDone ? "#16A34A" : isActive ? "#DC2626" : "#F1F5F9",
                    color:      isDone || isActive ? "#fff" : "#94A3B8",
                  }}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className="hidden text-xs font-semibold sm:block transition-colors duration-300"
                  style={{ color: isActive ? "#0F172A" : isDone ? "#16A34A" : "#CBD5E1" }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-2 h-px flex-1 transition-all duration-500"
                  style={{ background: isDone ? "#16A34A" : "#E2E8F0" }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  /* ── School badge (shown after step 1) ── */
  function SchoolBadge() {
    if (!validatedSchool) return null
    return (
      <div
        className="mb-6 flex items-center gap-3 rounded-2xl p-3.5"
        style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
      >
        {validatedSchool.logo ? (
          <Image
            src={validatedSchool.logo}
            alt={validatedSchool.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-contain border border-slate-200 bg-white p-0.5"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
               style={{ background: "#EFF6FF" }}>
            <School className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{validatedSchool.name}</p>
          <p className="text-xs text-slate-400">{validatedSchool.schoolCode}</p>
        </div>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
      </div>
    )
  }

  /* ── Step renders ── */
  function renderSchoolStep() {
    return (
      <form onSubmit={handleSchoolCodeSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            School Code
          </label>
          <input
            type="text"
            placeholder="e.g. DPS001"
            value={formData.schoolCode}
            onChange={(e) => handleInput("schoolCode", e.target.value.toUpperCase())}
            disabled={isLoading}
            autoComplete="off"
            className={`${inputCls} ${errors.schoolCode ? inputErr : inputOk} font-mono font-semibold tracking-widest`}
          />
          {errors.schoolCode && (
            <p className="mt-1.5 text-xs text-red-500">{errors.schoolCode}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)" }}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Validating…</>
          ) : (
            <>Continue <ArrowRight className="h-4 w-4" /></>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Super Admin?{" "}
          <Link href="/sd" className="font-semibold text-red-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    )
  }

  function renderIdentifierStep() {
    return (
      <form onSubmit={handleIdentifierSubmit} className="space-y-5">
        <SchoolBadge />
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mobile Number or Email
          </label>
          <input
            type="text"
            placeholder="10-digit mobile or email address"
            value={formData.identifier}
            onChange={(e) => handleInput("identifier", e.target.value)}
            disabled={isLoading}
            autoComplete="username"
            className={`${inputCls} ${errors.identifier ? inputErr : inputOk}`}
          />
          {errors.identifier && (
            <p className="mt-1.5 text-xs text-red-500">{errors.identifier}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("school")}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)" }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    )
  }

  function renderCredentialsStep() {
    return (
      <form onSubmit={handleCredentialsSubmit} className="space-y-5">
        <SchoolBadge />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-red-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInput("password", e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              className={`${inputCls} ${errors.password ? inputErr : inputOk} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" />
                : <Eye    className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("identifier")}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)" }}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing In…</>
            ) : (
              <>Sign In <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h1
          className="mb-1 font-extrabold leading-tight text-slate-900"
          style={{ fontFamily: "var(--font-playfair-auth, serif)", fontSize: "1.875rem" }}
        >
          {currentStep === "school"      && "Select your school"}
          {currentStep === "identifier"  && "Who are you?"}
          {currentStep === "credentials" && "Welcome back"}
        </h1>
        <p className="text-sm text-slate-500">
          {currentStep === "school"      && "Enter your school code to get started"}
          {currentStep === "identifier"  && "Enter your mobile number or email"}
          {currentStep === "credentials" && "Enter your password to continue"}
        </p>
      </div>

      {/* Step progress */}
      <StepProgress />

      {/* Alerts */}
      {sessionExpired && (
        <AlertStrip type="error">Your session has expired. Please sign in again.</AlertStrip>
      )}
{verified && (
        <AlertStrip type="success">Email verified successfully! You can now sign in.</AlertStrip>
      )}
      {error && (
        <AlertStrip type="error">
          {error === "CredentialsSignin" ? "Invalid credentials. Please try again." : error}
        </AlertStrip>
      )}
      {serverError && (
        <AlertStrip type="error">{serverError}</AlertStrip>
      )}

      {/* Step content */}
      {currentStep === "school"      && renderSchoolStep()}
      {currentStep === "identifier"  && renderIdentifierStep()}
      {currentStep === "credentials" && renderCredentialsStep()}
    </div>
  )
}
