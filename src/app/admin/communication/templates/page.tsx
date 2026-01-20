export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { MessageTemplateList } from "@/components/admin/communication/message-template-list";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Message Templates | Admin",
  description: "Manage message templates for SMS and email communications",
};

export default function MessageTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Message Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable message templates for SMS and email communications
            </p>
          </div>
        </div>
        <Link href="/admin/communication/templates/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
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
