export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { BulkCertificateGenerator } from '@/components/admin/certificates/bulk-certificate-generator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

async function CertificateGeneratorContent() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/login');
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch active templates
  const templatesData = await db.certificateTemplate.findMany({
    where: {
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

  // Fetch students with their current enrollment
  const students = await db.student.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      enrollments: {
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
