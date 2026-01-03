import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TemplateEditorForm } from "@/components/admin/report-cards/template-editor-form";

export default function CreateTemplatePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/report-cards/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Report Card Template</h1>
          <p className="text-muted-foreground mt-1">
            Design a new template for generating report cards
          </p>
        </div>
      </div>

      <TemplateEditorForm mode="create" />
    </div>
  );
}
