'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, AlertCircle } from 'lucide-react';

export function CertificateVerificationForm() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to the verification result page
      router.push(`/verify-certificate/${encodeURIComponent(verificationCode.trim())}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>
          Enter the verification code from your certificate to check its authenticity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="e.g., ABC123XYZ456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              className="font-mono text-lg"
              disabled={isLoading}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              The verification code is typically found at the bottom of your certificate or in the QR code
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !verificationCode.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Verify Certificate
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
