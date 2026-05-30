import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SchoolDetailTabs } from "@/components/super-admin/schools/school-detail-tabs";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SchoolDetailPage({ params }: Props) {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    try { await requireSuperAdminAccess(); } catch { redirect("/"); }

    const school = await db.school.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            schoolCode: true,
            email: true,
            phone: true,
            address: true,
            domain: true,
            subdomain: true,
            subdomainStatus: true,
            dnsConfigured: true,
            sslConfigured: true,
            sslExpiresAt: true,
            status: true,
            plan: true,
            isOnboarded: true,
            onboardingStep: true,
            tagline: true,
            logo: true,
            favicon: true,
            primaryColor: true,
            secondaryColor: true,
            razorpayCustomerId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    teachers: true,
                    students: true,
                    administrators: true,
                    parents: true,
                    classes: true,
                    Subject: true,
                },
            },
            teachers: {
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    employeeId: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            name: true,
                            email: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                },
            },
            students: {
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    rollNumber: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            name: true,
                            email: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                    enrollments: {
                        take: 1,
                        select: { class: { select: { name: true } } },
                    },
                },
            },
            administrators: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            name: true,
                            email: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                },
            },
            parents: {
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    occupation: true,
                    relation: true,
                    alternatePhone: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            name: true,
                            email: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                    children: {
                        take: 3,
                        select: {
                            student: {
                                select: {
                                    id: true,
                                    user: { select: { firstName: true, lastName: true, name: true } },
                                    enrollments: {
                                        take: 1,
                                        select: { class: { select: { name: true } } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            enhancedSubscriptions: {
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    status: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    cancelAtPeriodEnd: true,
                    trialEnd: true,
                    plan: {
                        select: { name: true, amount: true, currency: true, interval: true },
                    },
                    invoices: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        select: {
                            id: true,
                            amount: true,
                            currency: true,
                            status: true,
                            dueDate: true,
                            paidAt: true,
                        },
                    },
                    payments: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        select: {
                            id: true,
                            amount: true,
                            currency: true,
                            status: true,
                            paymentMethod: true,
                            processedAt: true,
                        },
                    },
                },
            },
        },
    });

    if (!school) notFound();

    return (
        <div className="space-y-5">
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900 -ml-2">
                <Link href="/super-admin/schools">
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back to Schools
                </Link>
            </Button>
            <SchoolDetailTabs school={school} />
        </div>
    );
}
