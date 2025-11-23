export const dynamic = 'force-dynamic';

/**
 * ID Card Generation Page
 * 
 * Admin page for generating student ID cards with photo, QR code, and barcode.
 * 
 * Requirements: 12.3, 12.4 - ID Card Generation and Print-Ready PDFs
 */

import { Suspense } from 'react';
import { BulkIDCardGenerator } from '@/components/admin/id-cards/bulk-id-card-generator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function IDCardGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ID Card Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate student ID cards with photo, QR code, and barcode
        </p>
      </div>

      <div className="max-w-3xl">
        <Suspense fallback={<LoadingSkeleton />}>
          <BulkIDCardGenerator />
        </Suspense>
      </div>
    </div>
  );
}
