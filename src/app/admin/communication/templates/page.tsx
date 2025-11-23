export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { MessageTemplateList } from "@/components/admin/communication/message-template-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Message Templates | Admin",
  description: "Manage message templates for SMS and email communications",
};

export default function MessageTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage reusable message templates for SMS and email communications
          </p>
        </div>
        <Link href="/admin/communication/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading templates...</div>}>
        <MessageTemplateList />
      </Suspense>
    </div>
  );
}
