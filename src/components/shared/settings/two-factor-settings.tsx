'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldAlert, Copy, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  initiateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
} from '@/lib/actions/two-factor-actions';
import toast from 'react-hot-toast';
import Image from 'next/image';

export function TwoFactorSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  
  // Setup state
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const result = await getTwoFactorStatus();
      if (result.success) {
        setIsEnabled(result.enabled);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setProcessing(true);
    try {
      const result = await initiateTwoFactorSetup();
      
      if (result.success && result.qrCode && result.secret && result.backupCodes) {
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setBackupCodes(result.backupCodes);
        setSetupStep('qr');
        setSetupDialogOpen(true);
      } else {
        toast.error(result.error || 'Failed to initiate 2FA setup');
      }
    } catch (error) {
      console.error('Error starting 2FA setup:', error);
      toast.error('Failed to start 2FA setup');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setProcessing(true);
    try {
      const result = await enableTwoFactor(secret, verificationCode, backupCodes);
      
      if (result.success) {
        setSetupStep('backup');
        setIsEnabled(true);
        toast.success('Two-factor authentication enabled successfully!');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setProcessing(true);
    try {
      const result = await disableTwoFactor(verificationCode);
      
      if (result.success) {
        setIsEnabled(false);
        setDisableDialogOpen(false);
        setVerificationCode('');
        toast.success('Two-factor authentication disabled');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setProcessing(true);
    try {
      const result = await regenerateBackupCodes(verificationCode);
      
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        toast.success('Backup codes regenerated successfully');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast.error('Failed to regenerate backup codes');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const closeSetupDialog = () => {
    setSetupDialogOpen(false);
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
    setVerificationCode('');
    setSetupStep('qr');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code in addition to your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">
                {isEnabled ? '2FA is enabled' : '2FA is disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Enable 2FA to secure your account'}
              </p>
            </div>
            <div className="flex gap-2">
              {isEnabled ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setRegenerateDialogOpen(true)}
                  >
                    Regenerate Codes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDisableDialogOpen(true)}
                  >
                    Disable
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartSetup} disabled={processing}>
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {isEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to keep your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={closeSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Scan the QR code with your authenticator app'}
              {setupStep === 'verify' && 'Enter the verification code from your app'}
              {setupStep === 'backup' && 'Save your backup codes'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
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
                <Label>Or enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Use apps like Google Authenticator, Authy, or Microsoft Authenticator to scan this code.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>
          )}

          {setupStep === 'backup' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  Save these backup codes in a secure location. Each code can only be used once.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadBackupCodes}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {setupStep === 'qr' && (
              <Button onClick={() => setSetupStep('verify')} className="w-full">
                Next
              </Button>
            )}
            {setupStep === 'verify' && (
              <>
                <Button variant="outline" onClick={() => setSetupStep('qr')}>
                  Back
                </Button>
                <Button onClick={handleVerifyAndEnable} disabled={processing}>
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </>
            )}
            {setupStep === 'backup' && (
              <Button onClick={closeSetupDialog} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your verification code to disable 2FA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification Code</Label>
              <Input
                id="disable-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDisableDialogOpen(false);
              setVerificationCode('');
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              Enter your verification code to generate new backup codes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regenerate-code">Verification Code</Label>
              <Input
                id="regenerate-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
            {backupCodes.length > 0 && (
              <>
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    Your old backup codes will no longer work. Save these new codes securely.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRegenerateDialogOpen(false);
              setVerificationCode('');
              setBackupCodes([]);
            }}>
              {backupCodes.length > 0 ? 'Done' : 'Cancel'}
            </Button>
            {backupCodes.length === 0 && (
              <Button onClick={handleRegenerateBackupCodes} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate New Codes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
