export const dynamic = 'force-dynamic';

/**
 * Certificates Management Page
 * 
 * Main overview page for certificate generation and management
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Award,
    FileText,
    Plus,
    ArrowRight,
    Trophy,
    Medal,
    Star,
    ScrollText,
    GraduationCap,
    UserCheck,
    ArrowLeft
} from 'lucide-react';
import { getCertificateTemplates } from '@/lib/actions/certificateTemplateActions';

async function CertificateStats() {
    const result = await getCertificateTemplates();

    if (!result.success) {
        return null;
    }

    const templates = result.data || [];
    const activeTemplates = templates.filter(t => t.isActive).length;

    // Count by type
    const typeCounts = templates.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Templates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{templates.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Templates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{activeTemplates}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Certificate Types
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(typeCounts).length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Set(templates.map(t => t.category).filter(Boolean)).size}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function CertificatesPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                <Link href="/admin/documents">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Documents
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and manage student certificates
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/admin/certificates/templates">
                            <FileText className="mr-2 h-4 w-4" />
                            Templates
                        </Link>
                    </Button>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/admin/certificates/generate">
                            <Plus className="mr-2 h-4 w-4" />
                            Generate Certificate
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <Suspense fallback={<StatsSkeleton />}>
                <CertificateStats />
            </Suspense>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Generate Certificates */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Award className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Generate Certificates</CardTitle>
                        </div>
                        <CardDescription>
                            Create certificates for students using your templates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/admin/certificates/generate">
                                Start Generating
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Manage Templates */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle>Manage Templates</CardTitle>
                        </div>
                        <CardDescription>
                            Create, edit, and customize certificate templates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/admin/certificates/templates">
                                View Templates
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Create New Template */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                            <CardTitle>New Template</CardTitle>
                        </div>
                        <CardDescription>
                            Create a new certificate template from scratch
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/admin/certificates/templates/new">
                                Create Template
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Certificate Types */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Certificate Types</CardTitle>
                    <CardDescription>
                        Different types of certificates you can generate
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <Trophy className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Achievement</h4>
                                <p className="text-sm text-muted-foreground">For recognizing accomplishments</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Completion</h4>
                                <p className="text-sm text-muted-foreground">For course/program completion</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <Medal className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Participation</h4>
                                <p className="text-sm text-muted-foreground">For event participation</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <Star className="h-5 w-5 text-teal-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Merit</h4>
                                <p className="text-sm text-muted-foreground">For academic excellence</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <UserCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium flex items-center gap-2">
                                    Character
                                    <Badge variant="secondary" className="text-xs">Indian</Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground">Conduct certificate</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <Award className="h-5 w-5 text-teal-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium flex items-center gap-2">
                                    Bonafide
                                    <Badge variant="secondary" className="text-xs">Indian</Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground">Enrollment proof</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <ScrollText className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium flex items-center gap-2">
                                    Transfer (TC)
                                    <Badge variant="secondary" className="text-xs">Indian</Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground">School transfer document</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Custom</h4>
                                <p className="text-sm text-muted-foreground">Create your own type</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
