import { SchoolCreationForm } from "@/components/super-admin/schools/school-creation-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";

export default async function CreateSchoolPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await requireSuperAdminAccess();
    } catch (error) {
        redirect("/");
    }

    return (
        <div className="container mx-auto py-6">
            <SchoolCreationForm />
        </div>
    );
}
