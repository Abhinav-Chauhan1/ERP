import { Metadata } from "next";
import { MessageHistoryList } from "@/components/admin/communication/message-history-list";
import { MessageAnalytics } from "@/components/admin/communication/message-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Message History | Admin Dashboard",
  description: "View message history and analytics",
};

export default function MessageHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Message History</h1>
            <p className="text-muted-foreground">
              View sent messages with delivery statistics and analytics
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          <MessageHistoryList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MessageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
