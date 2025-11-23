/**
 * Certificate Template Detail Page
 * 
 * View details of a specific certificate template
 */

import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCertificateTemplate, getCertificateTemplateStats } from '@/lib/actions/certificateTemplateActions';
import { ArrowLeft, Edit, Copy, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificateTemplateDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [templateResult, statsResult] = await Promise.all([
    getCertificateTemplate(id),
    getCertificateTemplateStats(id),
  ]);

  if (!templateResult.success || !templateResult.data) {
    notFound();
  }

  const template = templateResult.data;
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/certificates/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-gray-500 mt-1">{template.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/certificates/templates/${id}/preview`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/certificates/templates/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Template Information */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Basic details about this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Type:</span>
              <Badge>{template.type}</Badge>
            </div>
            {template.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Category:</span>
                <span className="font-medium">{template.category}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Page Size:</span>
              <span className="font-medium">{template.pageSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Orientation:</span>
              <span className="font-medium">{template.orientation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status:</span>
              <Badge variant={template.isActive ? 'default' : 'secondary'}>
                {template.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Default Template:</span>
              <Badge variant={template.isDefault ? 'default' : 'outline'}>
                {template.isDefault ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Certificate generation statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Certificates:</span>
                <span className="text-2xl font-bold">{stats.totalCertificates}</span>
              </div>
              {stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-500">Status Breakdown:</span>
                  {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between pl-4">
                      <span className="text-sm">{status}:</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Merge Fields */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Merge Fields</CardTitle>
            <CardDescription>Available variables for this template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template.mergeFields && template.mergeFields.length > 0 ? (
                template.mergeFields.map((field: string) => (
                  <Badge key={field} variant="secondary" className="font-mono">
                    {`{{${field}}}`}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No merge fields defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Layout Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Configuration</CardTitle>
            <CardDescription>Template layout settings</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(template.layout, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Styling Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Styling Configuration</CardTitle>
            <CardDescription>Template styling settings</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(template.styling, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Template Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>HTML template with merge fields</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
              {template.content}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Created:</span>
            <span>{new Date(template.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Last Updated:</span>
            <span>{new Date(template.updatedAt).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
