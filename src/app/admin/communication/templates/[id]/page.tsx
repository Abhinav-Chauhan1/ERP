import { getMessageTemplate } from "@/lib/actions/messageTemplateActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Copy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "View Message Template | Admin",
  description: "View message template details",
};

export default async function ViewMessageTemplatePage({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/communication/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            {template.description && (
              <p className="text-muted-foreground mt-2">{template.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!template.isDefault && (
            <Link href={`/admin/communication/templates/${template.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge className="mt-1">{template.type}</Badge>
            </div>

            {template.category && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-sm mt-1">{template.category}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
                {template.isDefault && (
                  <Badge variant="outline">System Default</Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm mt-1">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Variables</CardTitle>
            <CardDescription>
              These variables can be used in the template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((variable: string) => (
                <Badge key={variable} variant="secondary">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.subject && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Subject</p>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">{template.subject}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Body</p>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{template.body}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
