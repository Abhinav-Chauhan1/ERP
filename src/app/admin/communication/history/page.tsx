export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { MessageHistoryList } from "@/components/admin/communication/message-history-list";
import { MessageAnalytics } from "@/components/admin/communication/message-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Message History | Admin Dashboard",
  description: "View message history and analytics",
};

export default function MessageHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/admin/communication">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Message History</h1>
              <p className="text-muted-foreground">
                View sent messages with delivery statistics and analytics
              </p>
            </div>
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
