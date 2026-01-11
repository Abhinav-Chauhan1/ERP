import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Shield,
  Calendar,
  User,
  FileText,
  Award,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { verifyCertificateByCode } from '@/lib/actions/certificateGenerationActions';

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export const metadata = {
  title: 'Certificate Verification Result | SikshaMitra',
  description: 'View certificate verification details',
};

async function CertificateVerificationResult({ code }: { code: string }) {
  const result = await verifyCertificateByCode(code);

  if (!result.success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Certificate Not Found</AlertTitle>
          <AlertDescription className="mt-2">
            {result.error || 'The certificate with this verification code could not be found in our system.'}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Verification Failed</CardTitle>
            <CardDescription>
              This could mean:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>The verification code is incorrect or invalid</li>
              <li>The certificate has been revoked or expired</li>
              <li>The certificate was not issued by our institution</li>
            </ul>

            <Separator className="my-6" />

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact our administration office with the certificate details.
              </p>

              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/verify-certificate">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Try Another Code
                  </Link>
                </Button>
                <Button asChild variant="default">
                  <a href="mailto:admin@school.edu">
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const certificate = result.data;

  if (!certificate) {
    return notFound();
  }

  const isActive = certificate.status === 'ACTIVE';
  const isRevoked = certificate.status === 'REVOKED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Alert */}
      {isActive && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-lg font-semibold text-green-900 dark:text-green-100">
            Certificate Verified Successfully
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            This certificate is authentic and has been issued by our institution.
          </AlertDescription>
        </Alert>
      )}

      {/* Revoked Alert */}
      {isRevoked && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            Certificate Revoked
          </AlertTitle>
          <AlertDescription>
            This certificate has been revoked and is no longer valid.
          </AlertDescription>
        </Alert>
      )}

      {/* Certificate Details Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Certificate Details</CardTitle>
              <CardDescription>
                Official certificate information
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? 'default' : 'destructive'}
              className="text-sm px-3 py-1"
            >
              {certificate.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Certificate Number */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Certificate Number</p>
                <p className="text-lg font-mono font-semibold mt-1">
                  {certificate.certificateNumber}
                </p>
              </div>
            </div>

            <Separator />

            {/* Student Name */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Issued To</p>
                <p className="text-lg font-semibold mt-1">
                  {certificate.studentName}
                </p>
              </div>
            </div>

            <Separator />

            {/* Certificate Type */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Certificate Type</p>
                <p className="text-lg font-semibold mt-1">
                  {certificate.templateName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {certificate.templateType}
                </p>
              </div>
            </div>

            <Separator />

            {/* Issue Date */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                <p className="text-lg font-semibold mt-1">
                  {new Date(certificate.issuedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Verification Status */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {certificate.isVerified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-lg font-semibold text-green-600">Verified</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <p className="text-lg font-semibold text-red-600">Not Verified</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/verify-certificate">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Verify Another Certificate
              </Link>
            </Button>
            <Button asChild variant="default" className="flex-1">
              <a href="mailto:admin@school.edu">
                Report an Issue
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Important Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This verification confirms that the certificate was issued by our institution.
            For any questions or concerns about this certificate, please contact our administration
            office with the certificate number provided above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>
  );
}

export default async function VerifyCertificateResultPage({ params }: PageProps) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Certificate Verification Result
          </h1>
          <p className="text-lg text-muted-foreground">
            Verification Code: <span className="font-mono font-semibold">{code}</span>
          </p>
        </div>

        {/* Content */}
        <Suspense fallback={<LoadingSkeleton />}>
          <CertificateVerificationResult code={code} />
        </Suspense>
      </div>
    </div>
  );
}
