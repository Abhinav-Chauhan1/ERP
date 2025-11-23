export const dynamic = 'force-dynamic';

import { MessageTemplateForm } from "@/components/admin/communication/message-template-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "New Message Template | Admin",
  description: "Create a new message template",
};

export default function NewMessageTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/communication/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Message Template</h1>
          <p className="text-muted-foreground mt-2">
            Create a reusable message template for SMS or email communications
          </p>
        </div>
      </div>

      <MessageTemplateForm />
    </div>
  );
}
