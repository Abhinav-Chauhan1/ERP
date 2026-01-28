import { redirect } from "next/navigation";

interface SchoolViewPageProps {
    params: Promise<{ id: string }>;
}

export default async function SchoolViewPage({ params }: SchoolViewPageProps) {
    const { id } = await params;
    
    // Redirect to the comprehensive overview page
    redirect(`/super-admin/schools/${id}/overview`);
}