"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SchoolUsersClient } from "./school-users-client";
import { SchoolEditForm } from "./school-edit-form";
import { SchoolPermissionsManager } from "./school-permissions-manager";
import { SchoolUsageLimits } from "./school-usage-limits";
import { SchoolSecuritySettings } from "./school-security-settings";
import { SchoolNotificationSettings } from "./school-notification-settings";
import { SubdomainManagement } from "./subdomain-management";
import {
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    Mail,
    Phone,
    MapPin,
    Globe,
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    Download,
    Building,
    Settings,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

export interface SchoolDetailData {
    id: string;
    name: string;
    schoolCode: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    domain: string | null;
    subdomain: string | null;
    subdomainStatus: string | null;
    dnsConfigured: boolean;
    sslConfigured: boolean;
    sslExpiresAt: Date | null;
    status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
    plan: "STARTER" | "GROWTH" | "DOMINATE";
    isOnboarded: boolean;
    onboardingStep: number;
    tagline: string | null;
    logo: string | null;
    favicon: string | null;
    primaryColor: string;
    secondaryColor: string;
    razorpayCustomerId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        teachers: number;
        students: number;
        administrators: number;
        parents: number;
        classes: number;
        Subject: number;
    };
    teachers: Array<{
        id: string;
        employeeId: string;
        createdAt: Date;
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            isActive: boolean;
        };
    }>;
    students: Array<{
        id: string;
        rollNumber?: string | null;
        createdAt: Date;
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            isActive: boolean;
        };
        enrollments: Array<{ class: { name: string } }>;
    }>;
    administrators: Array<{
        id: string;
        createdAt: Date;
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            isActive: boolean;
        };
    }>;
    parents: Array<{
        id: string;
        occupation?: string | null;
        relation?: string | null;
        alternatePhone?: string | null;
        createdAt: Date;
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            isActive: boolean;
        };
        children: Array<{
            student: {
                id: string;
                user: { firstName: string | null; lastName: string | null; name?: string | null };
                enrollments: Array<{ class: { name: string } }>;
            };
        }>;
    }>;
    enhancedSubscriptions: Array<{
        id: string;
        status: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        trialEnd: Date | null;
        plan: { name: string; amount: number; currency: string; interval: string };
        invoices: Array<{
            id: string;
            amount: number;
            currency: string;
            status: string;
            dueDate: Date;
            paidAt: Date | null;
        }>;
        payments: Array<{
            id: string;
            amount: number;
            currency: string;
            status: string;
            paymentMethod: string | null;
            processedAt: Date | null;
        }>;
    }>;
}

function formatINR(paise: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

function statusColor(s: string) {
    if (s === "ACTIVE" || s === "PAID" || s === "COMPLETED") return "text-emerald-600 border-emerald-200 bg-emerald-50";
    if (s === "OPEN" || s === "PENDING") return "text-amber-600 border-amber-200 bg-amber-50";
    return "text-red-600 border-red-200 bg-red-50";
}

/* ------------------------------------------------------------------ */
/* Overview Tab                                                          */
/* ------------------------------------------------------------------ */

function OverviewTab({ school }: { school: SchoolDetailData }) {
    const sub = school.enhancedSubscriptions[0] ?? null;

    const stats = [
        { label: "Students", value: school._count.students, icon: Users, color: "bg-blue-50 text-blue-600" },
        { label: "Teachers", value: school._count.teachers, icon: GraduationCap, color: "bg-green-50 text-green-600" },
        { label: "Classes", value: school._count.classes, icon: BookOpen, color: "bg-teal-50 text-teal-600" },
        { label: "Subjects", value: school._count.Subject, icon: Calendar, color: "bg-orange-50 text-orange-600" },
    ];

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${s.color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                                        <p className="text-xs text-gray-500">{s.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Info + Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            School Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-sm">
                        {school.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span>{school.email}</span>
                            </div>
                        )}
                        {school.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span>{school.phone}</span>
                            </div>
                        )}
                        {school.domain && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span>{school.domain}</span>
                            </div>
                        )}
                        {school.subdomain && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                    {school.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || "yourdomain.com"}
                                </span>
                            </div>
                        )}
                        {school.address && (
                            <div className="flex items-start gap-2 text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span>{school.address}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
                            <div>
                                <p className="font-medium text-gray-700">Created</p>
                                <p>{school.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Updated</p>
                                <p>{school.updatedAt.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Plan & Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sub ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 capitalize">{school.plan.toLowerCase()} Plan</p>
                                        <p className="text-xs text-gray-500">{sub.plan.name} · {sub.plan.interval}</p>
                                    </div>
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[11px]">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <span className="text-xs font-medium text-gray-700">Next billing: </span>
                                    {sub.currentPeriodEnd.toLocaleDateString("en-IN")}
                                </div>
                                {sub.cancelAtPeriodEnd && (
                                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[11px]">
                                        Cancels at period end
                                    </Badge>
                                )}
                                {sub.trialEnd && new Date() < sub.trialEnd && (
                                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                                        <Clock className="h-3 w-3" />
                                        Trial ends {sub.trialEnd.toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <AlertCircle className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 capitalize">{school.plan.toLowerCase()} plan</p>
                                <p className="text-xs text-gray-400">No active subscription record</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Subdomain Management */}
            <SubdomainManagement
                schoolId={school.id}
                schoolName={school.name}
                subdomain={school.subdomain}
                subdomainStatus={school.subdomainStatus ?? undefined}
                dnsConfigured={school.dnsConfigured}
                sslConfigured={school.sslConfigured}
                sslExpiresAt={school.sslExpiresAt?.toISOString()}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Billing Tab                                                           */
/* ------------------------------------------------------------------ */

function BillingTab({ school }: { school: SchoolDetailData }) {
    const sub = school.enhancedSubscriptions[0] ?? null;

    return (
        <div className="space-y-5">
            {/* Subscription card */}
            {sub ? (
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Current Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Plan</p>
                                <p className="font-semibold text-gray-900">{sub.plan.name}</p>
                                <Badge variant="outline" className={`text-[11px] mt-1 ${statusColor(sub.status)}`}>
                                    {sub.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Billing cycle</p>
                                <p className="font-medium text-gray-900 capitalize">Per-student / {sub.plan.interval}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Next billing date</p>
                                <p className="font-medium text-gray-900">{sub.currentPeriodEnd.toLocaleDateString("en-IN")}</p>
                                {sub.cancelAtPeriodEnd && (
                                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[11px] mt-1">
                                        Cancels at period end
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="py-8 text-center">
                        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-700">No Active Subscription</p>
                        <p className="text-sm text-gray-400 mt-1">This school does not have an active subscription</p>
                    </CardContent>
                </Card>
            )}

            {/* Invoices */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    {sub?.invoices && sub.invoices.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-100">
                                    <TableHead className="text-xs">Invoice</TableHead>
                                    <TableHead className="text-xs">Amount</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs">Due Date</TableHead>
                                    <TableHead className="text-xs">Paid</TableHead>
                                    <TableHead className="w-8" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sub.invoices.map((inv) => (
                                    <TableRow key={inv.id} className="border-gray-100">
                                        <TableCell className="font-mono text-xs text-gray-500">{inv.id.slice(-8)}</TableCell>
                                        <TableCell className="text-sm font-medium">{formatINR(inv.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[11px] ${statusColor(inv.status)}`}>
                                                {inv.status === "PAID" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {inv.status === "OPEN" && <Clock className="h-3 w-3 mr-1" />}
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">{inv.dueDate.toLocaleDateString()}</TableCell>
                                        <TableCell className="text-sm text-gray-500">{inv.paidAt ? inv.paidAt.toLocaleDateString() : "—"}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Download className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No invoices found</p>
                    )}
                </CardContent>
            </Card>

            {/* Payments */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    {sub?.payments && sub.payments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-100">
                                    <TableHead className="text-xs">Payment</TableHead>
                                    <TableHead className="text-xs">Amount</TableHead>
                                    <TableHead className="text-xs">Method</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs">Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sub.payments.map((p) => (
                                    <TableRow key={p.id} className="border-gray-100">
                                        <TableCell className="font-mono text-xs text-gray-500">{p.id.slice(-8)}</TableCell>
                                        <TableCell className="text-sm font-medium">{formatINR(p.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs text-gray-600">{p.paymentMethod || "Card"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[11px] ${statusColor(p.status)}`}>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {p.processedAt ? p.processedAt.toLocaleDateString() : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No payments found</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Settings Tab                                                          */
/* ------------------------------------------------------------------ */

function SettingsTab({ school }: { school: SchoolDetailData }) {
    const [activeSection, setActiveSection] = useState<"edit" | "permissions" | "usage" | "security" | "notifications">("edit");

    const sections = [
        { id: "edit", label: "School Info" },
        { id: "permissions", label: "Permissions" },
        { id: "usage", label: "Usage Limits" },
        { id: "security", label: "Security" },
        { id: "notifications", label: "Notifications" },
    ] as const;

    return (
        <div className="space-y-5">
            {/* Section selector */}
            <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            activeSection === s.id
                                ? "bg-primary text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {activeSection === "edit" && <SchoolEditForm school={school} />}
            {activeSection === "permissions" && <SchoolPermissionsManager schoolId={school.id} />}
            {activeSection === "usage" && <SchoolUsageLimits schoolId={school.id} plan={school.plan} />}
            {activeSection === "security" && <SchoolSecuritySettings schoolId={school.id} />}
            {activeSection === "notifications" && <SchoolNotificationSettings schoolId={school.id} />}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main exported component                                              */
/* ------------------------------------------------------------------ */

export function SchoolDetailTabs({ school }: { school: SchoolDetailData }) {
    const statusBadgeClass =
        school.status === "ACTIVE"
            ? "text-emerald-600 border-emerald-200 bg-emerald-50"
            : school.status === "SUSPENDED"
                ? "text-amber-600 border-amber-200 bg-amber-50"
                : "text-red-600 border-red-200 bg-red-50"; // DEACTIVATED

    return (
        <div className="space-y-5">
            {/* School header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {school.logo && (
                        <img
                            src={school.logo}
                            alt={`${school.name} logo`}
                            className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                        />
                    )}
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{school.name}</h1>
                        <p className="text-sm text-gray-500">{school.schoolCode} {school.tagline ? `· ${school.tagline}` : ""}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[11px] ${statusBadgeClass}`}>
                        {school.status}
                    </Badge>
                    <Badge variant="outline" className={`text-[11px] ${school.isOnboarded ? "text-blue-600 border-blue-200 bg-blue-50" : "text-gray-500 border-gray-200"}`}>
                        {school.isOnboarded ? "Onboarded" : "Pending"}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
                <TabsList className="bg-gray-100 p-1 rounded-lg h-auto">
                    <TabsTrigger value="overview" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="users" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Users
                        <span className="ml-1.5 text-xs text-gray-400">{school._count.students + school._count.teachers + school._count.administrators}</span>
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Billing
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Settings className="h-3.5 w-3.5 mr-1.5" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5">
                    <OverviewTab school={school} />
                </TabsContent>

                <TabsContent value="users" className="mt-5">
                    <SchoolUsersClient school={school} />
                </TabsContent>

                <TabsContent value="billing" className="mt-5">
                    <BillingTab school={school} />
                </TabsContent>

                <TabsContent value="settings" className="mt-5">
                    <SettingsTab school={school} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
