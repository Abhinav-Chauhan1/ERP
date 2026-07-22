"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PTPatternAggregation, AssessmentRuleType, Prisma, PTPattern } from "@prisma/client";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export interface PTGroupDefinition {
  ptNumbers: number[];
  op: "BEST_OF" | "AVERAGE" | "SUM";
  count?: number;
  weight: number;
}

export interface PTPatternConfig {
  ptCount: number;
  ptStartNumber: number;
  perMarks: number;
  passingMarks: number;
  aggregation: PTPatternAggregation;
  bestOfCount?: number;
  groups?: PTGroupDefinition[];
}

export interface ApplyPTPatternInput {
  name: string;
  classId?: string | null;
  termId: string;
  cbseLevel?: string | null;
  config: PTPatternConfig;
  scopeClassIds: string[];
}

function patternToRuleInput(
  config: PTPatternConfig,
): { ruleType: AssessmentRuleType; count: number | null; weight: number } {
  const ruleType: AssessmentRuleType = (() => {
    switch (config.aggregation) {
      case "SUM":
        return "SUM";
      case "AVERAGE":
        return "AVERAGE";
      case "BEST_OF":
      case "USE_LAST":
        return "BEST_OF";
      case "CUSTOM_GROUPS":
        return "CUSTOM_GROUPS";
      default:
        return "SUM";
    }
  })();

  const count =
    config.aggregation === "BEST_OF"
      ? config.bestOfCount ?? 1
      : config.aggregation === "USE_LAST"
        ? 1
        : null;

  return { ruleType, count, weight: 1.0 };
}

/**
 * Resolve the active PT pattern for a given term.
 *
 * Filtering is exact: `termId` is required (per-term scoping is mandatory).
 * Class-specific patterns take precedence over school-wide ones; cbseLevel
 * acts as an additional tie-breaker when supplied.
 */
export async function getActivePTPattern(
  schoolId: string,
  termId: string,
  cbseLevel?: string | null,
  classId?: string | null,
): Promise<PTPattern | null> {
  try {
    if (!schoolId || !termId) return null;

    const candidates = await db.pTPattern.findMany({
      where: {
        schoolId,
        termId,
        isActive: true,
      },
      orderBy: [{ classId: "desc" }, { cbseLevel: "desc" }],
    });

    const score = (p: PTPattern): number => {
      let s = 0;
      if (p.classId && classId && p.classId === classId) s += 4;
      else if (!p.classId) s += 1;
      if (p.cbseLevel && cbseLevel && p.cbseLevel === cbseLevel) s += 2;
      else if (!p.cbseLevel) s += 1;
      return s;
    };

    const filtered = candidates.filter((p) => {
      if (classId && p.classId && p.classId !== classId) return false;
      if (cbseLevel && p.cbseLevel && p.cbseLevel !== cbseLevel) return false;
      return true;
    });

    if (filtered.length === 0) return null;
    filtered.sort((a, b) => score(b) - score(a));
    return filtered[0];
  } catch (error) {
    console.error("Error resolving active PT pattern:", error);
    return null;
  }
}

interface PatternForGeneration {
  id?: string;
  schoolId: string;
  termId: string;
  classId: string | null;
  name: string;
  ptCount: number;
  ptStartNumber: number;
  perMarks: number;
  passingMarks: number;
  aggregation: PTPatternAggregation;
  bestOfCount: number | null;
  groups: Prisma.JsonValue | null;
}

/**
 * Create PT ExamTypes, generate per-class/per-subject Exam rows, and upsert
 * the AssessmentRule that aggregates them. All work is scoped to a single
 * term (`pattern.termId`).
 *
 * PT exam-type names use the sequential offset:
 *   for n = 1..ptCount  →  "Periodic Test {ptStartNumber + n - 1}"
 */
export async function generatePTExamsAndRule(
  tx: Prisma.TransactionClient,
  pattern: PatternForGeneration,
  classIds: string[],
  classSubjectMap: Map<string, string[]>,
  termStartDate: Date,
  termEndDate: Date,
): Promise<{ ptTypeIds: string[]; created: number }> {
  const { schoolId, termId } = pattern;

  // 1) Sequential PT names
  const ptNames: string[] = [];
  for (let n = 1; n <= pattern.ptCount; n++) {
    ptNames.push(`Periodic Test ${pattern.ptStartNumber + n - 1}`);
  }

  // 2) Find or create ExamTypes (school-scoped, shared across terms)
  const existingTypes = await tx.examType.findMany({
    where: { schoolId, name: { in: ptNames } },
    select: { id: true, name: true },
  });
  const existingTypeMap = new Map(existingTypes.map((t) => [t.name, t]));

  const ptTypeIds: string[] = [];
  for (let i = 0; i < ptNames.length; i++) {
    const ptName = ptNames[i];
    const ptNumber = pattern.ptStartNumber + i;
    const found = existingTypeMap.get(ptName);
    if (found) {
      ptTypeIds.push(found.id);
      continue;
    }
    const created = await tx.examType.create({
      data: {
        schoolId,
        name: ptName,
        cbseComponent: "PT",
        weight: pattern.perMarks,
        description: `PT ${ptNumber} (${pattern.perMarks} marks)`,
        isActive: true,
        canRetest: false,
        includeInGradeCard: true,
      },
      select: { id: true, name: true },
    });
    ptTypeIds.push(created.id);
    existingTypeMap.set(created.name, created);
  }

  // 3) Wipe existing PT exams (and their results) in THIS term for THIS scope.
  //    Rule's termId-scoping guarantees we never touch other terms' PTs.
  const existingPTExams = await tx.exam.findMany({
    where: {
      schoolId,
      classId: { in: classIds },
      termId,
      examTypeId: { in: ptTypeIds },
    },
    select: { id: true },
  });
  if (existingPTExams.length > 0) {
    const ids = existingPTExams.map((e) => e.id);
    await tx.examResult.deleteMany({ where: { examId: { in: ids } } });
    await tx.exam.deleteMany({ where: { id: { in: ids } } });
  }

  // 4) Generate Exam rows per class per subject
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + 15);
  const base = earliest > termStartDate ? earliest : new Date(termStartDate);

  const examsToCreate: Prisma.ExamCreateManyInput[] = [];
  for (const clsId of classIds) {
    // Dedupe: a subject can appear more than once per class (e.g. assigned separately
    // per section via SubjectClass), but a class should only get one exam per subject.
    const classSubjectIds = [...new Set(classSubjectMap.get(clsId) ?? [])];
    if (classSubjectIds.length === 0) continue;

    for (let n = 1; n <= pattern.ptCount; n++) {
      const examTypeId = ptTypeIds[n - 1];
      const ptNumber = pattern.ptStartNumber + n - 1;
      const dayOffset = 30 * n;
      const examDate = new Date(base);
      examDate.setDate(examDate.getDate() + dayOffset);
      if (examDate > termEndDate) examDate.setTime(termEndDate.getTime());

      const startTime = new Date(examDate);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 60);

      const title = `PT ${ptNumber}`;
      for (const subjectId of classSubjectIds) {
        examsToCreate.push({
          schoolId,
          classId: clsId,
          subjectId,
          termId,
          examTypeId,
          title,
          totalMarks: pattern.perMarks,
          passingMarks: pattern.passingMarks,
          examDate,
          startTime,
          endTime,
        });
      }
    }
  }

  const created =
    examsToCreate.length === 0
      ? 0
      : (
          await tx.exam.createMany({
            data: examsToCreate,
            skipDuplicates: false,
          })
        ).count;

  // 5) Upsert the AssessmentRule SCOPED TO THIS TERM
  const { ruleType, count, weight } = patternToRuleInput({
    ptCount: pattern.ptCount,
    ptStartNumber: pattern.ptStartNumber,
    perMarks: pattern.perMarks,
    passingMarks: pattern.passingMarks,
    aggregation: pattern.aggregation,
    bestOfCount: pattern.bestOfCount ?? undefined,
  });

  const ruleName = `PT Pattern: ${pattern.name}`;
  const existingRule = await tx.assessmentRule.findFirst({
    where: {
      schoolId,
      classId: pattern.classId,
      termId,
      name: ruleName,
    },
    select: { id: true },
  });

  const ruleData = {
    ruleType,
    examTypes: ptTypeIds,
    count,
    weight,
  };

  if (existingRule) {
    await tx.assessmentRule.update({
      where: { id: existingRule.id },
      data: ruleData,
    });
  } else {
    await tx.assessmentRule.create({
      data: {
        schoolId,
        classId: pattern.classId,
        termId,
        name: ruleName,
        ...ruleData,
      },
    });
  }

  return { ptTypeIds, created };
}

export async function applyPTPattern(schoolId: string, input: ApplyPTPatternInput) {
  try {
    if (!schoolId) return { success: false, error: "School context required" };

    const { config, scopeClassIds, termId, classId, cbseLevel, name } = input;

    if (config.ptCount < 1 || config.ptCount > 4) {
      return { success: false, error: "PT count must be between 1 and 4" };
    }
    if (config.ptStartNumber < 1) {
      return { success: false, error: "PT start number must be >= 1" };
    }
    if (!termId) {
      return { success: false, error: "termId is required (one PT pattern per term)" };
    }

    const term = await db.term.findFirst({
      where: { id: termId, schoolId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!term) return { success: false, error: "Term not found" };

    const subjectClasses = await db.subjectClass.findMany({
      where: { classId: { in: scopeClassIds }, schoolId },
      select: { classId: true, subjectId: true },
    });
    const classSubjectMap = new Map<string, string[]>();
    for (const sc of subjectClasses) {
      const arr = classSubjectMap.get(sc.classId) ?? [];
      arr.push(sc.subjectId);
      classSubjectMap.set(sc.classId, arr);
    }

    const result = await db.$transaction(
      async (tx) => {
        // Deactivate any existing pattern(s) for this scope (term + optional class).
        // We keep the rows for audit but flip isActive=false so getActivePTPattern
        // never returns stale configurations.
        await tx.pTPattern.updateMany({
          where: {
            schoolId,
            termId,
            classId: classId ?? null,
            isActive: true,
          },
          data: { isActive: false },
        });

        const pattern = await tx.pTPattern.create({
          data: {
            schoolId,
            classId: classId ?? null,
            termId,
            cbseLevel: cbseLevel ?? null,
            name,
            ptCount: config.ptCount,
            ptStartNumber: config.ptStartNumber,
            perMarks: config.perMarks,
            passingMarks: config.passingMarks,
            aggregation: config.aggregation,
            bestOfCount: config.bestOfCount ?? null,
            groups: config.groups
              ? (config.groups as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            isActive: true,
          },
        });

        const { created } = await generatePTExamsAndRule(
          tx,
          {
            id: pattern.id,
            schoolId,
            termId,
            classId: classId ?? null,
            name: pattern.name,
            ptCount: config.ptCount,
            ptStartNumber: config.ptStartNumber,
            perMarks: config.perMarks,
            passingMarks: config.passingMarks,
            aggregation: config.aggregation,
            bestOfCount: config.bestOfCount ?? null,
            groups: pattern.groups,
          },
          scopeClassIds,
          classSubjectMap,
          term.startDate,
          term.endDate,
        );

        return { pattern, created };
      },
      { timeout: 30000, maxWait: 10000 },
    );

    revalidatePath("/admin/assessment/exams");
    return {
      success: true,
      data: result.pattern,
      created: result.created,
      message: `Applied PT pattern: created ${result.created} exam${result.created !== 1 ? "s" : ""} across ${scopeClassIds.length} class${scopeClassIds.length !== 1 ? "es" : ""}`,
    };
  } catch (error) {
    console.error("Error applying PT pattern:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply PT pattern",
    };
  }
}

export async function regenerateExamsFromPTPattern(
  schoolId: string,
  patternId: string,
  scopeClassIds: string[],
) {
  try {
    if (!schoolId) return { success: false, error: "School context required" };
    const pattern = await db.pTPattern.findFirst({
      where: { id: patternId, schoolId, isActive: true },
    });
    if (!pattern) return { success: false, error: "PT pattern not found" };

    const term = await db.term.findFirst({
      where: { id: pattern.termId, schoolId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!term) return { success: false, error: "Term not found" };

    const subjectClasses = await db.subjectClass.findMany({
      where: { classId: { in: scopeClassIds }, schoolId },
      select: { classId: true, subjectId: true },
    });
    const classSubjectMap = new Map<string, string[]>();
    for (const sc of subjectClasses) {
      const arr = classSubjectMap.get(sc.classId) ?? [];
      arr.push(sc.subjectId);
      classSubjectMap.set(sc.classId, arr);
    }

    const result = await db.$transaction(
      async (tx) =>
        generatePTExamsAndRule(
          tx,
          {
            id: pattern.id,
            schoolId,
            termId: pattern.termId,
            classId: pattern.classId,
            name: pattern.name,
            ptCount: pattern.ptCount,
            ptStartNumber: pattern.ptStartNumber,
            perMarks: pattern.perMarks,
            passingMarks: pattern.passingMarks,
            aggregation: pattern.aggregation,
            bestOfCount: pattern.bestOfCount,
            groups: pattern.groups,
          },
          scopeClassIds,
          classSubjectMap,
          term.startDate,
          term.endDate,
        ),
      { timeout: 30000, maxWait: 10000 },
    );

    return {
      success: true,
      created: result.created,
      message: `Regenerated ${result.created} PT exam${result.created !== 1 ? "s" : ""} for pattern "${pattern.name}"`,
    };
  } catch (error) {
    console.error("Error regenerating PT pattern exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to regenerate exams",
    };
  }
}

export async function listPTPatterns(schoolId: string) {
  try {
    if (!schoolId) return [];
    return await db.pTPattern.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error listing PT patterns:", error);
    return [];
  }
}

export async function deletePTPattern(schoolId: string, patternId: string) {
  try {
    if (!schoolId) return { success: false, error: "School context required" };
    await db.pTPattern.update({
      where: { id: patternId, schoolId },
      data: { isActive: false },
    });
    revalidatePath("/admin/assessment/exams");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete PT pattern",
    };
  }
}

export async function applyPTPatternForCurrentSchool(input: ApplyPTPatternInput) {
  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return { success: false, error: "School context required" };
  return applyPTPattern(schoolId, input);
}

export async function getActivePTPatternForCurrentSchool(
  termId: string,
  cbseLevel?: string | null,
  classId?: string | null,
) {
  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;
  return getActivePTPattern(schoolId, termId, cbseLevel, classId);
}
