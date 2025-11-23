import { getMessageTemplate } from "@/lib/actions/messageTemplateActions";
import { MessageTemplateForm } from "@/components/admin/communication/message-template-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Message Template | Admin",
  description: "Edit message template",
};

export default async function EditMessageTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMessageTemplate(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const template = result.data;

  if (template.isDefault) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/communication/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cannot Edit System Template</h1>
            <p className="text-muted-foreground mt-2">
              System default templates cannot be edited. You can duplicate this template to create a custom version.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/communication/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Message Template</h1>
          <p className="text-muted-foreground mt-2">
            Update the message template details
          </p>
        </div>
      </div>

      <MessageTemplateForm template={template} />
    </div>
  );
}
