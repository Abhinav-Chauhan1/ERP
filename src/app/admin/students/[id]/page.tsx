import { redirect } from "next/navigation";

export default async function LegacyStudentDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/users/students/${id}`);
}
