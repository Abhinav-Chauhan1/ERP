import { Metadata } from "next";
import { BulkMessageComposer } from "@/components/admin/communication/bulk-message-composer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Bulk Messaging | Admin Dashboard",
  description: "Send bulk messages to multiple recipients",
};

export default function BulkMessagingPage() {
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
            <h1 className="text-2xl font-bold tracking-tight">Bulk Messaging</h1>
            <p className="text-muted-foreground">
              Send SMS and email messages to multiple recipients at once
            </p>
          </div>
        </div>
      </div>

      <BulkMessageComposer />
    </div>
  );
}
