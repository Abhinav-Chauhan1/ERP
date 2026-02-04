import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportTicketManagement } from "@/components/super-admin/support/support-ticket-management";
import { KnowledgeBaseManagement } from "@/components/super-admin/support/knowledge-base-management";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Support Management</h1>
        <p className="text-gray-400 mt-1">Manage support tickets and knowledge base</p>
      </div>

      {/* Support Content */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
          <TabsTrigger
            value="tickets"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            Support Tickets
          </TabsTrigger>
          <TabsTrigger
            value="knowledge-base"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            Knowledge Base
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SupportTicketManagement />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge-base">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <KnowledgeBaseManagement />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}