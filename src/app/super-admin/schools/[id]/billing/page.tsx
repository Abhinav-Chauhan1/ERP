import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Link from "next/link";
import { 
  ArrowLeft, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from "lucide-react";

interface SchoolBillingPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolBillingPage({ params }: SchoolBillingPageProps) {
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
          plan: {
            select: {
              name: true,
              amount: true,
              currency: true,
              interval: true,
            },
          },
          invoices: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              dueDate: true,
              paidAt: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              paymentMethod: true,
              processedAt: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!school) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
        <p className="text-gray-500 mb-6">The school you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/super-admin/schools">Return to Schools List</Link>
        </Button>
      </div>
    );
  }

  const currentSubscription = school.subscriptions[0];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/super-admin/schools/${school.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
        </div>
      </div>

      {/* Subscription Overview */}
      {currentSubscription ? (
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
          </CardContent>
        </Card>
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

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices
                  </CardTitle>
                  <CardDescription>
                    View and manage invoices for this school
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentSubscription?.invoices && currentSubscription.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSubscription.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              invoice.status === "PAID" ? "default" : 
                              invoice.status === "PENDING" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {invoice.status === "PAID" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {invoice.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                            {invoice.status === "FAILED" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {invoice.paidAt ? invoice.paidAt.toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                  <CardDescription>
                    View payment transactions and methods
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentSubscription?.payments && currentSubscription.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSubscription.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.paymentMethod || "Card"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === "SUCCEEDED" ? "default" : 
                              payment.status === "PENDING" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {payment.status === "SUCCEEDED" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {payment.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                            {payment.status === "FAILED" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.processedAt ? payment.processedAt.toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Subscription History
              </CardTitle>
              <CardDescription>
                Complete history of subscription changes and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {school.subscriptions.map((subscription, index) => (
                  <div key={subscription.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Current" : "Previous"}
                        </Badge>
                        <span className="font-medium">{subscription.plan.name}</span>
                      </div>
                      <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span>Period: </span>
                        {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                      </div>
                      <div>
                        <span>Amount: </span>
                        ${(subscription.plan.amount / 100).toFixed(2)}/{subscription.plan.interval}
                      </div>
                    </div>
                  </div>
                ))}
                {school.subscriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscription history found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}