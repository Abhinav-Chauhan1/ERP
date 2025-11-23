export const dynamic = 'force-dynamic';

/**
 * Certificate Templates Management Page
 * 
 * Admin page for managing certificate templates
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCertificateTemplates } from '@/lib/actions/certificateTemplateActions';
import { Plus, FileText, Award, Trophy, Medal, Star } from 'lucide-react';
import Link from 'next/link';

async function CertificateTemplatesList() {
  const result = await getCertificateTemplates();

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading templates: {result.error}</p>
      </div>
    );
  }

  const templates = result.data || [];

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new certificate template.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/admin/certificates/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
        return <Trophy className="h-5 w-5" />;
      case 'COMPLETION':
        return <Award className="h-5 w-5" />;
      case 'PARTICIPATION':
        return <Medal className="h-5 w-5" />;
      case 'MERIT':
        return <Star className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETION':
        return 'bg-blue-100 text-blue-800';
      case 'PARTICIPATION':
        return 'bg-green-100 text-green-800';
      case 'MERIT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(template.type)}
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
              {template.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {template.description || 'No description'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Type:</span>
                <Badge className={getTypeBadgeColor(template.type)}>
                  {template.type}
                </Badge>
              </div>
              {template.category && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium">{template.category}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Page Size:</span>
                <span className="font-medium">{template.pageSize}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Orientation:</span>
                <span className="font-medium">{template.orientation}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex gap-2 pt-4">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/certificates/templates/${template.id}`}>
                    View
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link href={`/admin/certificates/templates/${template.id}/edit`}>
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplatesListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CertificateTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Templates</h1>
          <p className="text-gray-500 mt-1">
            Create and manage certificate templates for generating certificates and ID cards
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/certificates/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TemplatesListSkeleton />}>
        <CertificateTemplatesList />
      </Suspense>
    </div>
  );
}
