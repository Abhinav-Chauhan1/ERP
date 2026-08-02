export const dynamic = "force-dynamic";

import { getStudentWithDetails } from "@/lib/actions/studentActions";
import { getFeePayments } from "@/lib/actions/feePaymentActions";
import { StudentDetailClient } from "./student-detail-client";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [student, paymentsResult] = await Promise.all([
    getStudentWithDetails(id),
    getFeePayments({ studentId: id }),
  ]);

  const initialPayments = Array.isArray(paymentsResult)
    ? paymentsResult
    : paymentsResult && typeof paymentsResult === "object" && "data" in paymentsResult && Array.isArray((paymentsResult as any).data)
      ? (paymentsResult as any).data
      : [];

  return (
    <StudentDetailClient id={id} initialStudent={student} initialPayments={initialPayments} />
  );
}
