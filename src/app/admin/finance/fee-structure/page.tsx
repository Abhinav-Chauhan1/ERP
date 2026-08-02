export const dynamic = "force-dynamic";

import {
  getFeeStructures,
  getFeeTypes,
  getFeeStructureStats,
} from "@/lib/actions/feeStructureActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";
import { FeeStructureClient } from "./fee-structure-client";

export default async function FeeStructurePage() {
  const [structuresResult, yearsResult, classesResult, typesResult, statsResult] = await Promise.all([
    getFeeStructures(),
    getAcademicYears(),
    getClasses(),
    getFeeTypes(true),
    getFeeStructureStats(),
  ]);

  return (
    <FeeStructureClient
      initialFeeStructures={structuresResult.success ? structuresResult.data || [] : []}
      initialAcademicYears={yearsResult.success ? yearsResult.data || [] : []}
      initialClasses={classesResult.success ? classesResult.data || [] : []}
      initialFeeTypes={typesResult.success ? typesResult.data || [] : []}
      initialStats={statsResult.success ? statsResult.data : null}
    />
  );
}
