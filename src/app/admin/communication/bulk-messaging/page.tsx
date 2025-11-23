import { Metadata } from "next";
import { BulkMessageComposer } from "@/components/admin/communication/bulk-message-composer";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Bulk Messaging | Admin Dashboard",
  description: "Send bulk messages to multiple recipients",
};

export default function BulkMessagingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Messaging</h1>
        <p className="text-muted-foreground">
          Send SMS and email messages to multiple recipients at once
        </p>
      </div>

      <BulkMessageComposer />
    </div>
  );
}
