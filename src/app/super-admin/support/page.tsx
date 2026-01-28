import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportTicketManagement } from "@/components/super-admin/support/support-ticket-management";
import { KnowledgeBaseManagement } from "@/components/super-admin/support/knowledge-base-management";

export default async function SupportPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage support tickets, knowledge base, and customer communications
          </p>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <SupportTicketManagement />
        </TabsContent>

        <TabsContent value="knowledge-base">
          <KnowledgeBaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}