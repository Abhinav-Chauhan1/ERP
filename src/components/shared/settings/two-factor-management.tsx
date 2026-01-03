"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, ShieldCheck, ShieldOff, Key, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  initiateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes
} from "@/lib/actions/two-factor-nextauth-actions"
import Image from "next/image"

export function TwoFactorManagement() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  
  // Setup state
  const [setupStep, setSetupStep] = useState<"password" | "qr" | "verify" | "backup">("password")
  const [password, setPassword] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [regenerateCode, setRegenerateCode] = useState("")
  const [processing, setProcessing] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const result = await getTwoFactorStatus()
      if (result.success) {
        setEnabled(result.enabled)
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSetup = () => {
    setSetupStep("password")
    setPassword("")
    setQrCode("")
    setSecret("")
    setBackupCodes([])
    setVerificationCode("")
    setShowSetupDialog(true)
  }

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      const result = await initiateTwoFactorSetup(password)
      
      if (result.success && result.qrCode && result.secret && result.backupCodes) {
        setQrCode(result.qrCode)
        setSecret(result.secret)
        setBackupCodes(result.backupCodes)
        setSetupStep("qr")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to initiate 2FA setup",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error initiating 2FA setup:", error)
      toast({
        title: "Error",
        description: "Failed to initiate 2FA setup",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      const result = await enableTwoFactor(secret, verificationCode, backupCodes)
      
      if (result.success) {
        setSetupStep("backup")
        setEnabled(true)
        toast({
          title: "Success",
          description: "Two-factor authentication enabled successfully"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid verification code",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to enable 2FA",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDisable = async () => {
    if (!disableCode) {
      toast({
        title: "Error",
        description: "Please enter your 2FA code",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      const result = await disableTwoFactor(disableCode)
      
      if (result.success) {
        setEnabled(false)
        setShowDisableDialog(false)
        setDisableCode("")
        toast({
          title: "Success",
          description: "Two-factor authentication disabled"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid verification code",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode) {
      toast({
        title: "Error",
        description: "Please enter your 2FA code",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      const result = await regenerateBackupCodes(regenerateCode)
      
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes)
        setShowRegenerateDialog(false)
        setRegenerateCode("")
        
        // Show backup codes in a new dialog
        setSetupStep("backup")
        setShowSetupDialog(true)
        
        toast({
          title: "Success",
          description: "Backup codes regenerated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid verification code",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error regenerating backup codes:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate backup codes",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const downloadBackupCodes = () => {
    const text = backupCodes.join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "2fa-backup-codes.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {enabled ? (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <ShieldOff className="h-3 w-3" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication adds an additional layer of security to your account by requiring
            more than just a password to sign in.
          </p>

          {enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="font-medium text-sm">2FA is enabled</p>
                    <p className="text-xs text-muted-foreground">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateDialog(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleStartSetup}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === "password" && "Confirm Your Password"}
              {setupStep === "qr" && "Scan QR Code"}
              {setupStep === "verify" && "Verify Setup"}
              {setupStep === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "password" && "Enter your password to continue"}
              {setupStep === "qr" && "Scan this QR code with your authenticator app"}
              {setupStep === "verify" && "Enter the code from your authenticator app"}
              {setupStep === "backup" && "Save these backup codes in a safe place"}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  placeholder="Enter your password"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={processing || !password}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === "qr" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCode && (
                  <Image
                    src={qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="border rounded-lg"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Manual Entry Code</Label>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {secret}
                </code>
              </div>
              <DialogFooter>
                <Button onClick={() => setSetupStep("verify")}>
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyAndEnable()}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={processing || verificationCode.length !== 6}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Enable 2FA"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code key={index} className="p-2 bg-muted rounded text-sm text-center">
                    {code}
                  </code>
                ))}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={downloadBackupCodes} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Codes
                </Button>
                <Button onClick={() => setShowSetupDialog(false)} className="w-full sm:w-auto">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your account less secure. Enter your 2FA code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disableCode">Verification Code</Label>
            <Input
              id="disableCode"
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={processing || disableCode.length !== 6}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Backup Codes Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Backup Codes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate your existing backup codes. Enter your 2FA code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="regenerateCode">Verification Code</Label>
            <Input
              id="regenerateCode"
              type="text"
              value={regenerateCode}
              onChange={(e) => setRegenerateCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRegenerateCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateBackupCodes}
              disabled={processing || regenerateCode.length !== 6}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Codes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
