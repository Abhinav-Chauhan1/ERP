export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getSchoolBranding } from "@/lib/actions/school-branding";
import BrandingForm from "@/components/admin/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BrandingPage() {
  const result = await getSchoolBranding();
  const branding = result.success && result.data ? result.data : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Branding</h1>
        <p className="text-muted-foreground mt-2">
          Customize your school's appearance across the system
        </p>
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
            <BrandingForm initialData={branding} />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}
