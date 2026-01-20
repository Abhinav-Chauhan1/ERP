export const dynamic = 'force-dynamic';

/**
 * Certificate Template Preview Page
 * 
 * Preview a certificate template with sample data
 */

import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCertificateTemplate, previewCertificateTemplate } from '@/lib/actions/certificateTemplateActions';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CertificateTemplatePreviewPage({ params }: PageProps) {
    const { id } = await params;

    const [templateResult, previewResult] = await Promise.all([
        getCertificateTemplate(id),
        previewCertificateTemplate(id),
    ]);

    if (!templateResult.success || !templateResult.data) {
        notFound();
    }

    const template = templateResult.data;
    const previewHtml = previewResult.success ? previewResult.data : null;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                <Link href={`/admin/certificates/templates/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Template
                    </Button>
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Preview: {template.name}</h1>
                    <p className="text-gray-500 mt-1">Preview with sample data</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href={`/admin/certificates/templates/${id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Template Info */}
            <div className="flex gap-4 flex-wrap">
                <Badge variant="secondary">Type: {template.type}</Badge>
                {template.category && <Badge variant="outline">Category: {template.category}</Badge>}
                <Badge variant="outline">Page Size: {template.pageSize}</Badge>
                <Badge variant="outline">Orientation: {template.orientation}</Badge>
            </div>

            {/* Preview Container */}
            <Card>
                <CardHeader>
                    <CardTitle>Certificate Preview</CardTitle>
                    <CardDescription>
                        This preview uses sample data. Actual certificates will have real student information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        className={`bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 mx-auto ${template.orientation === 'LANDSCAPE'
                            ? 'max-w-4xl aspect-[1.414/1]'
                            : 'max-w-2xl aspect-[1/1.414]'
                            }`}
                        style={{
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        {previewHtml ? (
                            <div
                                className="w-full h-full overflow-auto"
                                dangerouslySetInnerHTML={{ __html: (previewHtml as unknown) as string }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Unable to generate preview. Please check the template content.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Sample Data Used */}
            <Card>
                <CardHeader>
                    <CardTitle>Sample Data Used</CardTitle>
                    <CardDescription>
                        The following sample values were used to generate this preview
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {template.mergeFields && template.mergeFields.map((field: string) => (
                            <div key={field} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-mono text-sm text-gray-600">{`{{${field}}}`}</span>
                                <span className="text-sm text-gray-900">{getSampleValue(field)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function getSampleValue(field: string): string {
    const sampleData: Record<string, string> = {
        studentName: 'Rahul Sharma',
        fatherName: 'Mr. Rajesh Sharma',
        motherName: 'Mrs. Priya Sharma',
        className: 'Class 10',
        section: 'A',
        academicYear: '2025-2026',
        admissionNumber: 'ADM/2023/001',
        dateOfBirth: '15-08-2010',
        dateOfBirthWords: 'Fifteenth August Two Thousand Ten',
        issueDate: new Date().toLocaleDateString('en-IN'),
        certificateNumber: 'CERT/2026/001',
        schoolName: 'Howard Convent School',
        conduct: 'Excellent',
        character: 'Good',
        purpose: 'Scholarship Application',
        nationality: 'Indian',
        category: 'General',
        admissionDate: '01-04-2020',
        classAtAdmission: 'Class 5',
        classLeaving: 'Class 10',
        dateOfLeaving: new Date().toLocaleDateString('en-IN'),
        reasonForLeaving: 'Parent Request',
        promotionStatus: 'Promoted to Class 11',
        feeStatus: 'All dues cleared',
        gamesPlayed: 'Cricket, Football',
        extraActivities: 'NCC, Debate Club',
        remarks: 'Excellent student with good academic record',
        achievementTitle: 'Science Olympiad Winner',
        courseName: 'Mathematics',
        eventName: 'Annual Science Fair 2026',
        eventDate: '15-01-2026',
        grade: 'A+',
        rank: '1st',
        percentage: '95%',
        position: '1st Place',
        primaryColor: '#1a365d',
        secondaryColor: '#2c5282',
    };

    return sampleData[field] || `Sample ${field}`;
}
