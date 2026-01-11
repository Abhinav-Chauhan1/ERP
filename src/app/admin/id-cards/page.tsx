export const dynamic = 'force-dynamic';

/**
 * ID Cards Management Page
 * 
 * Main overview page for ID card generation and management
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IdCard, Users, Printer, QrCode, Barcode, ArrowRight, ArrowLeft } from 'lucide-react';

function LoadingSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function IDCardsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Breadcrumb */}
            <Link
                href="/admin/documents"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Documents
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ID Cards</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and manage student and staff ID cards
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/id-cards/generate">
                        <IdCard className="mr-2 h-4 w-4" />
                        Generate ID Cards
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Generate ID Cards */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <IdCard className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Generate ID Cards</CardTitle>
                            </div>
                            <CardDescription>
                                Create ID cards for students with photos, QR codes, and barcodes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/admin/id-cards/generate">
                                    Start Generating
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Bulk Generation */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle>Bulk Generation</CardTitle>
                            </div>
                            <CardDescription>
                                Generate ID cards for entire classes or multiple students at once
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/admin/id-cards/generate">
                                    Bulk Generate
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Features Info */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Printer className="h-6 w-6 text-green-600" />
                                </div>
                                <CardTitle>Print-Ready PDFs</CardTitle>
                            </div>
                            <CardDescription>
                                Generate print-ready PDF files with proper dimensions for ID card printing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <QrCode className="h-4 w-4" />
                                    <span>QR Code for verification</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Barcode className="h-4 w-4" />
                                    <span>Barcode for library/attendance</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* ID Card Features */}
            <Card>
                <CardHeader>
                    <CardTitle>ID Card Features</CardTitle>
                    <CardDescription>
                        Student ID cards include the following information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <h4 className="font-medium">Student Information</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Student Photo</li>
                                <li>• Full Name</li>
                                <li>• Class & Section</li>
                                <li>• Roll Number</li>
                            </ul>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium">School Details</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• School Logo</li>
                                <li>• School Name</li>
                                <li>• Academic Year</li>
                                <li>• Contact Info</li>
                            </ul>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium">Security Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• QR Code</li>
                                <li>• Barcode</li>
                                <li>• Admission Number</li>
                                <li>• Unique ID</li>
                            </ul>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium">Additional Info</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Blood Group</li>
                                <li>• Parent Contact</li>
                                <li>• Address</li>
                                <li>• Emergency Contact</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
