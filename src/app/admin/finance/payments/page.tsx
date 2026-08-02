export const dynamic = "force-dynamic";

import {
  getFeePayments,
  getPendingFees,
  getPaymentStats,
  getStudentsForPayment,
} from "@/lib/actions/feePaymentActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const [yearsResult, studentsResult] = await Promise.all([
    getAcademicYears(),
    getStudentsForPayment(),
  ]);

  const academicYears = yearsResult.success ? yearsResult.data || [] : [];
  const currentYear = academicYears.find((y: any) => y.isCurrent);
  const academicYearFilter = yearsResult.success ? currentYear?.id ?? "all" : "all";
  const yearFilter = academicYearFilter === "all" ? undefined : academicYearFilter;

  const [paymentsResult, pendingResult, statsResult] = await Promise.all([
    getFeePayments({ limit: 100, academicYearId: yearFilter }),
    getPendingFees({ limit: 50, academicYearId: yearFilter }),
    getPaymentStats({ academicYearId: yearFilter }),
  ]);

  return (
    <PaymentsClient
      initialPayments={paymentsResult.success ? paymentsResult.data || [] : []}
      initialPendingFees={pendingResult.success ? pendingResult.data || [] : []}
      initialStudents={studentsResult.success ? studentsResult.data || [] : []}
      initialStats={statsResult.success ? statsResult.data : null}
      initialAcademicYears={academicYears}
      initialAcademicYearFilter={academicYearFilter}
    />
  );
}
