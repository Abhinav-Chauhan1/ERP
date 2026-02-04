import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";

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

  // Prepare initial data for the wizard
  const wizardInitialData = {
    schoolName: school.name || "",
    schoolEmail: school.email || "",
    schoolPhone: school.phone || "",
    schoolAddress: school.address || "",
    schoolWebsite: "", // Not stored in school model, will be collected in wizard
    timezone: "Asia/Kolkata", // Default timezone, not stored in school model
    schoolLogo: school.logo || "",
    tagline: school.tagline || "",
    // Keep admin fields empty as they need to be created
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
    adminPosition: "Principal",
    // Keep academic fields empty as they need to be set up
    academicYearName: "",
    academicYearStart: null,
    academicYearEnd: null,
    terms: [
      { name: "Term 1", startDate: null, endDate: null },
      { name: "Term 2", startDate: null, endDate: null },
      { name: "Term 3", startDate: null, endDate: null },
    ],
    selectedClasses: [],
    sections: ["A", "B"],
  };

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
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      {school.subdomain}.yourdomain.com
                    </span>
                    <Badge variant="outline">{school.plan}</Badge>
                    <Badge variant={school.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {school.status}
                    </Badge>
                  </div>
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
          initialData={wizardInitialData}
        />
      </div>
    </div>
  );
}