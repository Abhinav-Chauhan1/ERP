export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getSystemSettings } from "@/lib/actions/settingsActions";
import BrandingForm from "@/components/admin/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BrandingPage() {
  const result = await getSystemSettings();
  const settings = result.success && result.data ? result.data : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Branding</h1>
          <p className="text-muted-foreground mt-1">
            Customize your school's appearance across the system
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <Card>
          <CardHeader>
            <CardTitle>Branding Settings</CardTitle>
            <CardDescription>
              Configure your school's logo, colors, and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandingForm initialData={settings} />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}
