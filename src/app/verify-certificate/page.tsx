export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CertificateVerificationForm } from '@/components/certificate-verification-form';
import { Shield, CheckCircle2, FileCheck } from 'lucide-react';

export const metadata = {
  title: 'Verify Certificate | School ERP',
  description: 'Verify the authenticity of certificates issued by our institution',
};

export default function VerifyCertificatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Certificate Verification Portal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify the authenticity of certificates issued by our institution. 
            Enter the verification code found on your certificate to check its validity.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <CertificateVerificationForm />
          </Suspense>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">How to Verify</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Locate the verification code on your certificate</li>
                  <li>Enter the code in the form above</li>
                  <li>Click "Verify Certificate"</li>
                  <li>View the certificate details if valid</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">What You'll See</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Certificate number and type</li>
                  <li>Student name and details</li>
                  <li>Issue date and status</li>
                  <li>Verification confirmation</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>
                If you're having trouble verifying a certificate or have questions about its authenticity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please contact our administration office at{' '}
                <a href="mailto:admin@school.edu" className="text-blue-600 hover:underline">
                  admin@school.edu
                </a>{' '}
                or call us at{' '}
                <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                  +1 (234) 567-890
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
