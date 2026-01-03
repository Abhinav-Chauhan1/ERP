export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, ArrowLeft, Star, Copy, Trash2, Power } from "lucide-react";
import { getReportCardTemplates } from "@/lib/actions/reportCardTemplateActions";
import { formatDate } from "@/lib/utils";
import { TemplateActions } from "@/components/admin/report-cards/template-actions";

export default async function ReportCardTemplatesPage() {
  const templatesResult = await getReportCardTemplates();
  const templates = templatesResult.success ? templatesResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/report-cards">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Report Card Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage customizable templates for report card generation
          </p>
        </div>
        <Link href="/admin/assessment/report-cards/templates/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Create and manage report card templates with custom layouts and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates available</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first report card template to start generating customized report cards.
              </p>
              <Link href="/admin/assessment/report-cards/templates/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: any) => (
                <Card key={template.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.isDefault && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Page Size:</span>
                        <span className="font-medium">{template.pageSize}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Orientation:</span>
                        <span className="font-medium">{template.orientation}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-xs">{formatDate(template.createdAt)}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Link href={`/admin/assessment/report-cards/templates/${template.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Edit
                          </Button>
                        </Link>
                        <TemplateActions template={template} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
