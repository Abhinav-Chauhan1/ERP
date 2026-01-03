import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TemplateEditorForm } from "@/components/admin/report-cards/template-editor-form";
import { getReportCardTemplate } from "@/lib/actions/reportCardTemplateActions";

interface EditTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params;
  const result = await getReportCardTemplate(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const template = result.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/report-cards/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Template</h1>
          <p className="text-muted-foreground mt-1">
            Modify the template &quot;{template.name}&quot;
          </p>
        </div>
      </div>

      <TemplateEditorForm template={template} mode="edit" />
    </div>
  );
}
