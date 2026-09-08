/**
 * One-off: backfill missing section subject rows and generate the 2026-2027 CBSE
 * exam set for Nursery..Class 10.
 *
 * Reuses the app's own autoGenerateCBSEExamsForSchool so the rows are identical to
 * what the admin "Auto-generate" wizard produces. All work runs inside
 * runWithTenantContext so the RLS extension resolves a school without a session.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generate-exams-2026-27.ts            # dry run
 *   npx tsx --env-file=.env scripts/generate-exams-2026-27.ts --apply    # write
 */
import { PrismaClient } from "@prisma/client";
import { db } from "../src/lib/db";
import { runWithTenantContext } from "../src/lib/tenant-context";
import { autoGenerateCBSEExamsForSchool } from "../src/lib/actions/examsActions";

const APPLY = process.argv.includes("--apply");

const ACADEMIC_YEAR = "2026-2027";
// Class 1 and Nursery already hold a complete exam set; Class 11/12 are out of scope.
const SKIP_CLASSES = new Set(["Class 1", "Nursery", "Class 11", "Class 12"]);
// Both CBSE schedules are identical, and the active PT patterns are tagged
// CBSE_PRIMARY — passing that level lets every class reuse them.
const CBSE_LEVEL = "CBSE_PRIMARY" as const;

/** Sections with no SubjectClass rows inherit them from a section that has them. */
async function backfillSectionSubjects() {
  const classes = await db.class.findMany({
    where: { academicYear: { name: ACADEMIC_YEAR } },
    select: {
      id: true,
      name: true,
      schoolId: true,
      sections: { select: { id: true, name: true } },
      subjects: { select: { subjectId: true, sectionId: true, order: true } },
    },
  });

  const planned: { class: string; from: string; to: string; rows: number }[] = [];

  for (const cls of classes) {
    const covered = new Set(cls.subjects.filter((s) => s.sectionId).map((s) => s.sectionId!));
    const missing = cls.sections.filter((s) => !covered.has(s.id));
    if (missing.length === 0 || covered.size === 0) continue;

    const sourceSectionId = [...covered][0];
    const sourceName = cls.sections.find((s) => s.id === sourceSectionId)?.name ?? "?";
    const template = cls.subjects.filter((s) => s.sectionId === sourceSectionId);

    for (const section of missing) {
      planned.push({ class: cls.name, from: sourceName, to: section.name, rows: template.length });
      if (!APPLY) continue;

      await db.subjectClass.createMany({
        data: template.map((t) => ({
          schoolId: cls.schoolId,
          classId: cls.id,
          subjectId: t.subjectId,
          sectionId: section.id,
          teacherId: null, // deliberately unassigned — admin fills these in
          order: t.order,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log(planned.length ? "SUBJECT BACKFILL:" : "SUBJECT BACKFILL: nothing missing");
  planned.forEach((p) =>
    console.log(`  ${p.class}: section ${p.from} -> ${p.to} (${p.rows} subject rows, no teacher)`)
  );
}

async function generateExams(schoolId: string) {
  const classes = await db.class.findMany({
    where: { academicYear: { name: ACADEMIC_YEAR } },
    select: { id: true, name: true, _count: { select: { exams: true, subjects: true } } },
  });

  const target = classes
    .filter((c) => !SKIP_CLASSES.has(c.name) && c._count.subjects > 0)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (target.length === 0) throw new Error("No target classes resolved");

  const terms = await db.term.findMany({
    where: { academicYear: { name: ACADEMIC_YEAR } },
    select: { id: true, name: true },
    orderBy: { startDate: "asc" },
  });

  console.log(`\nTARGET CLASSES (${target.length}): ${target.map((c) => `${c.name}[${c._count.exams}]`).join(", ")}`);
  console.log(`SKIPPED: ${classes.filter((c) => SKIP_CLASSES.has(c.name)).map((c) => c.name).join(", ")}`);
  console.log(`TERMS: ${terms.map((t) => t.name).join(", ")}`);

  const scRows = await db.subjectClass.findMany({
    where: { classId: { in: target.map((c) => c.id) } },
    select: { classId: true, subjectId: true },
  });
  const perClass = new Map<string, Set<string>>();
  scRows.forEach((r) => {
    if (!perClass.has(r.classId)) perClass.set(r.classId, new Set());
    perClass.get(r.classId)!.add(r.subjectId);
  });

  if (!APPLY) {
    // Mirror the generator: PT(1) + MA + Portfolio + term-end, per subject per term.
    let projected = 0;
    for (const c of target) {
      const n = perClass.get(c.id)?.size ?? 0;
      projected += n * 4 * terms.length;
      console.log(`  ${c.name}: ${n} subjects x 4 types x ${terms.length} terms = ${n * 4 * terms.length}`);
    }
    console.log(`\nDRY RUN — would create ~${projected} exams. Re-run with --apply to write.`);
    return;
  }

  for (const term of terms) {
    const result: any = await autoGenerateCBSEExamsForSchool(schoolId, {
      termId: term.id,
      classIds: target.map((c) => c.id),
      cbseLevel: CBSE_LEVEL,
    });
    console.log(`  ${term.name}: ${result.success ? result.message : `FAILED — ${result.error}`}`);
  }
}

async function main() {
  console.log(APPLY ? "=== APPLY ===" : "=== DRY RUN ===");

  // Discovery runs on a bare client: resolving the school is what gives us the
  // tenant context the RLS-extended `db` requires.
  const bare = new PrismaClient();
  const year = await bare.academicYear.findFirst({
    where: { name: ACADEMIC_YEAR },
    select: { schoolId: true, school: { select: { name: true } } },
  });
  await bare.$disconnect();
  if (!year) throw new Error(`Academic year ${ACADEMIC_YEAR} not found`);
  console.log(`School: ${year.school.name} (${year.schoolId})`);

  await runWithTenantContext({ schoolId: year.schoolId, isSuperAdmin: false }, async () => {
    await backfillSectionSubjects();
    await generateExams(year.schoolId);
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("ERR", e); process.exit(1); })
  .finally(() => db.$disconnect());
