import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await requireSuperAdminAccess();
    } catch (error) {
        redirect("/");
    }

    const school = await db.school.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            schoolCode: true,
            status: true,
            plan: true,
            subscriptions: {
                select: {
                    id: true,
                    status: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    cancelAtPeriodEnd: true,
                    trialEnd: true,
                    createdAt: true,
                    plan: {
                        select: {
                            name: true,
                            amount: true,
                            currency: true,
                            interval: true,
                            features: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });

    if (!school) {
        redirect("/super-admin/schools");
    }

    const currentSubscription = school.subscriptions.find(sub => sub.status === "ACTIVE");

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/super-admin/schools/${school.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Subscription Management</h1>
                    <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
                        {school.status}
                    </Badge>
                </div>
            </div>

            {currentSubscription ? (
                <div className="space-y-6">
                    {/* Current Subscription */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Current Subscription
                            </CardTitle>
                            <CardDescription>
                                Active subscription details and billing information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-2xl font-bold">{currentSubscription.plan.name}</p>
                                    <Badge variant={currentSubscription.status === "ACTIVE" ? "default" : "secondary"}>
                                        {currentSubscription.status}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="text-2xl font-bold">
                                        ${(currentSubscription.plan.amount / 100).toFixed(2)}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            /{currentSubscription.plan.interval}
                                        </span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Next Billing</p>
                                    <p className="text-lg font-semibold">
                                        {currentSubscription.currentPeriodEnd.toLocaleDateString()}
                                    </p>
                                    {currentSubscription.cancelAtPeriodEnd && (
                                        <Badge variant="destructive">Cancels at period end</Badge>
                                    )}
                                </div>
                            </div>
                            
                            <Separator className="my-6" />
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Current Period</p>
                                    <p className="font-medium">
                                        {currentSubscription.currentPeriodStart.toLocaleDateString()} - {currentSubscription.currentPeriodEnd.toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Subscription Started</p>
                                    <p className="font-medium">{currentSubscription.createdAt.toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            {currentSubscription.trialEnd && new Date() < currentSubscription.trialEnd && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">
                                            Trial ends on {currentSubscription.trialEnd.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-6 flex gap-2">
                                <Button>Modify Subscription</Button>
                                <Button variant="outline">View Billing Details</Button>
                                {!currentSubscription.cancelAtPeriodEnd && (
                                    <Button variant="destructive">Cancel Subscription</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Features</CardTitle>
                            <CardDescription>
                                Features included in the current subscription plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentSubscription.plan.features && typeof currentSubscription.plan.features === 'object' ? (
                                    Object.entries(currentSubscription.plan.features as Record<string, any>).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <div className="flex items-center gap-2">
                                                {typeof value === 'boolean' ? (
                                                    value ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )
                                                ) : (
                                                    <Badge variant="outline">{String(value)}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">No feature information available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                            <p className="text-muted-foreground mb-4">
                                This school does not have an active subscription.
                            </p>
                            <Button>Create Subscription</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Subscription History */}
            {school.subscriptions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Subscription History
                        </CardTitle>
                        <CardDescription>
                            Complete history of subscription changes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {school.subscriptions.map((subscription, index) => (
                                <div key={subscription.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                                                {subscription.status}
                                            </Badge>
                                            <span className="font-medium">{subscription.plan.name}</span>
                                            {index === 0 && subscription.status === "ACTIVE" && (
                                                <Badge variant="outline">Current</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                ${(subscription.plan.amount / 100).toFixed(2)}/{subscription.plan.interval}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                        <div>
                                            <span>Period: </span>
                                            {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                                        </div>
                                        <div>
                                            <span>Created: </span>
                                            {subscription.createdAt.toLocaleDateString()}
                                        </div>
                                    </div>
                                    {subscription.cancelAtPeriodEnd && (
                                        <div className="mt-2">
                                            <Badge variant="destructive" className="text-xs">
                                                Scheduled for cancellation
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
