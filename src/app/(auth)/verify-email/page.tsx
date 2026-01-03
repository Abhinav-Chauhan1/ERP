"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react"

/**
 * Email Verification Page
 * 
 * Handles email verification flow with token validation
 * Requirements: 12.5, 12.6, 15.7
 */
export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const verifyEmail = async (verificationToken: string) => {
      try {
        setStatus("loading")

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token: verificationToken })
        })

        const data = await response.json()

        if (data.success) {
          setStatus("success")
          setMessage(data.message || "Email verified successfully!")
          setEmail(data.email || "")

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 3000)
        } else {
          // Check if token expired (Requirement 12.5)
          if (data.expired) {
            setStatus("expired")
            setMessage(data.error || "Verification token has expired")
          } else {
            setStatus("error")
            setMessage(data.error || "Email verification failed")
          }
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("An error occurred during verification. Please try again.")
      }
    }

    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    verifyEmail(token)
  }, [token, router])

  const handleResendVerification = async () => {
    if (!email && !token) {
      setMessage("Unable to resend verification email. Please register again.")
      return
    }

    try {
      setResending(true)

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email || undefined,
          token: token || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Verification email sent! Please check your inbox.")
      } else {
        setMessage(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      console.error("Resend error:", error)
      setMessage("An error occurred. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {status === "loading" && (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            )}
            {(status === "error" || status === "expired") && (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
            {status === "expired" && "Token Expired"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we verify your email address..."}
            {status === "success" && "Your email has been successfully verified"}
            {status === "error" && "We couldn't verify your email address"}
            {status === "expired" && "Your verification link has expired"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === "success" ? "default" : "destructive"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Redirecting you to login page...
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}

          {(status === "expired" || status === "error") && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start">
                  <Mail className="mr-3 h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900">
                      Need a new verification link?
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Click the button below to receive a new verification email.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full"
                variant="outline"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>

              <Button
                onClick={() => router.push("/register")}
                variant="ghost"
                className="w-full"
              >
                Back to Registration
              </Button>
            </div>
          )}

          {status === "loading" && (
            <div className="flex justify-center py-4">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-gray-600">
                  Verifying your email address...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
