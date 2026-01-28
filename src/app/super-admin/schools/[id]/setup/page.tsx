import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Users } from "lucide-react";

interface SetupPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolSetupPage({ params }: SetupPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  // Get school details
  const school = await db.school.findUnique({
    where: { id },
  });

  if (!school) {
    redirect("/super-admin/schools");
  }

  // If already onboarded, redirect to school details
  if (school.isOnboarded) {
    redirect(`/super-admin/schools/${id}`);
  }

  const metadata = (school as any)?.metadata || {};

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* School Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{school.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      {school.subdomain}.yourdomain.com
                    </span>
                    <Badge variant="outline">{school.plan}</Badge>
                    <Badge variant={school.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {school.status}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">School Code:</span>
                <div className="font-medium">{school.schoolCode}</div>
              </div>
              <div>
                <span className="text-gray-500">Contact Email:</span>
                <div className="font-medium">{school.email}</div>
              </div>
              <div>
                <span className="text-gray-500">Extra Students:</span>
                <div className="font-medium">{metadata.extraStudents || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Complete School Setup</CardTitle>
            <CardDescription>
              Follow the setup wizard to configure the school's basic information, 
              create the admin account, and set up the academic structure.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Setup Wizard */}
        <SetupWizard
          currentStep={0}
          hasExistingAdmin={false}
          redirectUrl={`/super-admin/schools/${id}`}
          schoolId={id}
        />
      </div>
    </div>
  );
}