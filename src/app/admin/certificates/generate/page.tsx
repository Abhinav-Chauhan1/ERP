export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { BulkCertificateGenerator } from '@/components/admin/certificates/bulk-certificate-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function CertificateGeneratorContent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // CRITICAL: Get school context first
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const dbUser = await db.user.findFirst({
    where: { 
      id: session.user.id,
    },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch active templates - CRITICAL: Filter by school
  const templatesData = await db.certificateTemplate.findMany({
    where: {
      schoolId, // CRITICAL: Ensure templates belong to current school
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Map templates to convert null to undefined
  const templates = templatesData.map(t => ({
    ...t,
    category: t.category ?? undefined,
  }));

  // Fetch students with their current enrollment - CRITICAL: Filter by school
  const students = await db.student.findMany({
    where: {
      schoolId, // CRITICAL: Ensure students belong to current school
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      enrollments: {
        where: {
          schoolId, // CRITICAL: Ensure enrollments belong to current school
        },
        include: {
          class: {
            select: {
              name: true,
            },
          },
          section: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          enrollDate: 'desc',
        },
        take: 1,
      },
    },
    orderBy: [
      {
        user: {
          firstName: 'asc',
        },
      },
    ],
  });

  const formattedStudents = students.map((student) => ({
    id: student.id,
    name: `${student.user.firstName} ${student.user.lastName}`,
    admissionId: student.admissionId,
    className: student.enrollments[0]?.class.name || 'N/A',
    sectionName: student.enrollments[0]?.section.name || 'N/A',
  }));

  return (
    <BulkCertificateGenerator
      templates={templates}
      students={formattedStudents}
    />
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function CertificateGeneratePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/admin/certificates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Generate Certificates</h1>
        <p className="text-muted-foreground mt-2">
          Generate certificates for multiple students at once
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CertificateGeneratorContent />
      </Suspense>
    </div>
  );
}
