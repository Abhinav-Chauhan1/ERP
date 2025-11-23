import { getMessageHistoryById } from "@/lib/actions/messageHistoryActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function MessageHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMessageHistoryById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const message = result.data;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SENT: "default",
      PARTIALLY_SENT: "secondary",
      FAILED: "destructive",
      PENDING: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      SMS: "bg-blue-100 text-blue-800",
      EMAIL: "bg-green-100 text-green-800",
      BOTH: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={colors[type]} variant="outline">
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/communication/history">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Details</h1>
          <p className="text-muted-foreground">
            View detailed information about this message
          </p>
        </div>
      </div>

      {/* Message Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Information</CardTitle>
                <div className="flex gap-2">
                  {getTypeBadge(message.messageType)}
                  {getStatusBadge(message.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {message.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Subject
                  </label>
                  <p className="mt-1 text-lg font-medium">{message.subject}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Message Body
                </label>
                <div className="mt-1 p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Sent Date
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{format(new Date(message.sentAt), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Sent By
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p>
                      {message.sender.firstName} {message.sender.lastName}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Recipient Selection</CardTitle>
              <CardDescription>How recipients were selected</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-auto">
                {JSON.stringify(message.recipientSelection, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Delivery Results */}
          {message.results && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Results</CardTitle>
                <CardDescription>Detailed delivery information</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(message.results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Total Recipients
                </label>
                <p className="text-2xl font-bold">{message.recipientCount}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Successfully Sent
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {message.sentCount}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Failed
                </label>
                <p className="text-2xl font-bold text-red-600">
                  {message.failedCount}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </label>
                <p className="text-2xl font-bold">
                  {message.recipientCount > 0
                    ? ((message.sentCount / message.recipientCount) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Channel Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">SMS</span>
                </div>
                <span className="text-lg font-bold">{message.smsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <span className="text-lg font-bold">{message.emailCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  SMS Cost
                </span>
                <span className="font-medium">${message.smsCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Email Cost
                </span>
                <span className="font-medium">${message.emailCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Cost</span>
                </div>
                <span className="text-lg font-bold">
                  ${message.totalCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
