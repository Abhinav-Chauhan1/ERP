/**
 * Showcase CBSE report card generator — READ-ONLY.
 *
 * Produces fully-populated, print-ready CBSE annual report card PDFs using the
 * app's real renderer (`generateCBSEReportCardPDF`), real student/school details
 * pulled from the database, and *synthetic* marks, grades, attendance and remarks
 * generated in-memory from a seeded RNG.
 *
 * Nothing is written to the database. Every Prisma call this script makes goes
 * through a client that hard-fails on any mutating operation (see `readOnlyDb`).
 * The renderer itself touches the DB exactly once — `gradeScale.findMany` inside
 * `getCBSEGradeScale` — which is also a read.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generate-showcase-report-card.ts
 *   npx tsx --env-file=.env scripts/generate-showcase-report-card.ts --classes "Class 5,Class 9,Class 12"
 *   npx tsx --env-file=.env scripts/generate-showcase-report-card.ts --class "Class 4" --count 3
 *   npx tsx --env-file=.env scripts/generate-showcase-report-card.ts --admission 419
 *   npx tsx --env-file=.env scripts/generate-showcase-report-card.ts --school SCBIJNOR2024 --seed 99
 *
 * Flags:
 *   --school <code|id>   School to pull from                  (default: first school with the most students)
 *   --classes <a,b,c>    Comma-separated class names          (default: Class 5, Class 9, Class 12)
 *   --class <name>       Single class (repeatable)
 *   --admission <id>     Pick a specific student by admission no. (repeatable; overrides --classes)
 *   --count <n>          Students per class                   (default: 1)
 *   --seed <n>           RNG seed for reproducible marks      (default: 20260818)
 *   --out <dir>          Output directory                     (default: storage/showcase-report-cards)
 *   --anonymize          Replace student/parent names with sample names
 */
import fs from "fs";
import path from "path";

import { PrismaClient } from "@prisma/client";

import { runWithTenantContext } from "../src/lib/tenant-context";
import { generateCBSEReportCardPDF, generateBatchCBSEReportCards } from "../src/lib/services/report-card-cbse-renderer";
import { calculateResultStatus } from "../src/lib/services/report-card-data-aggregation";
import type {
  MultiTermReportCardData,
  StudentInfoExtended,
  TermSlice,
  TermSubjectResult,
  ComponentMark,
  CoScholasticResult,
} from "../src/lib/services/report-card-data-aggregation";

// ---------------------------------------------------------------------------
// Read-only Prisma client — any write operation throws before it reaches the DB
// ---------------------------------------------------------------------------

const WRITE_OPS = new Set([
  "create", "createMany", "createManyAndReturn",
  "update", "updateMany", "updateManyAndReturn",
  "upsert", "delete", "deleteMany",
  "executeRaw", "executeRawUnsafe", "queryRaw", "queryRawUnsafe",
]);

const readOnlyDb = new PrismaClient({ log: ["error"] }).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (WRITE_OPS.has(operation)) {
          throw new Error(
            `[showcase] Blocked write attempt: ${model}.${operation}. This script is read-only.`,
          );
        }
        return query(args);
      },
    },
  },
});

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function argValues(flag: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === flag && process.argv[i + 1]) out.push(process.argv[i + 1]);
  });
  return out;
}

const SCHOOL_ARG   = argValue("--school");
const COUNT        = parseInt(argValue("--count") ?? "1", 10);
const SEED         = parseInt(argValue("--seed") ?? "20260818", 10);
const OUT_DIR      = path.resolve(process.cwd(), argValue("--out") ?? "storage/showcase-report-cards");
const ANONYMIZE    = process.argv.includes("--anonymize");
const ADMISSION_IDS = argValues("--admission");
const CLASS_NAMES  = (() => {
  const csv = argValue("--classes");
  const singles = argValues("--class");
  if (csv) return csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (singles.length) return singles;
  return ["Class 5", "Class 9", "Class 12"];
})();

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) — same seed always yields the same report cards
// ---------------------------------------------------------------------------

function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable per-student seed so a student's marks don't shift when the roster does */
function hashSeed(base: number, key: string): number {
  let h = base >>> 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0);
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Sample content pools (used only to fill gaps / --anonymize)
// ---------------------------------------------------------------------------

const OCCUPATIONS = ["Business", "Government Service", "Farmer", "Teacher", "Shopkeeper", "Engineer", "Private Service", "Homemaker"];
const TEACHER_REMARKS = [
  "An attentive and hardworking learner who participates actively in class discussions.",
  "Shows consistent improvement across all subjects. Keep up the sincere effort.",
  "A disciplined student with a positive attitude towards studies and co-curricular activities.",
  "Excellent conceptual clarity. Encouraged to take part in more inter-house competitions.",
  "Punctual and well-behaved. A little more practice in written work will help further.",
];
const PRINCIPAL_REMARKS = [
  "Keep up the good work and continue to aim higher.",
  "A promising performance this session. Best wishes for the year ahead.",
  "Well done. Consistency will take you a long way.",
];
const SAMPLE_FIRST  = ["Aarav", "Ishita", "Kabir", "Meera", "Rehan", "Ananya", "Vivaan", "Sara"];
const SAMPLE_LAST   = ["Sharma", "Verma", "Khan", "Singh", "Gupta", "Ansari", "Chauhan", "Bano"];

/** CBSE 5-point scale for co-scholastic subject areas */
const FIVE_POINT = ["A", "B", "C", "D", "E"];
/** CBSE 3-point scale for activities / skill subjects */
const THREE_POINT = ["A", "B", "C"];

/** Standard CBSE co-scholastic areas used when the school hasn't configured its own */
const DEFAULT_CO_SCHOLASTIC = [
  { name: "Work Education", category: "CO_SCHOLASTIC" },
  { name: "Art Education", category: "CO_SCHOLASTIC" },
  { name: "Health & Physical Education", category: "CO_SCHOLASTIC" },
];
const DEFAULT_SKILL_ACTIVITIES = [
  { name: "Discipline", category: "SKILL_ACTIVITY" },
  { name: "Attitude & Values", category: "SKILL_ACTIVITY" },
  { name: "Regularity & Punctuality", category: "SKILL_ACTIVITY" },
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
/** Clamped score out of `max` around an ability level (0..1) with some spread */
function score(rng: () => number, max: number, ability: number, spread = 0.12): number {
  const noise = (rng() + rng() + rng()) / 3 - 0.5;          // roughly normal, centred on 0
  const frac  = Math.min(0.99, Math.max(0.38, ability + noise * spread * 2));
  return Math.max(Math.ceil(max * 0.4), Math.round(max * frac));
}

// ---------------------------------------------------------------------------
// Types for what we read out of the DB
// ---------------------------------------------------------------------------

type DbSubject = { id: string; name: string; code: string; category: string; type: string; hasPractical: boolean };

// ---------------------------------------------------------------------------
// Mark builders
// ---------------------------------------------------------------------------

type ScaleEntry = { grade: string; min: number; gp: number };

/** Standard CBSE 9-point scale — used only if the school has no GradeScale rows */
const DEFAULT_SCALE: ScaleEntry[] = [
  { grade: "A1", min: 91, gp: 10 }, { grade: "A2", min: 81, gp: 9 },
  { grade: "B1", min: 71, gp: 8 },  { grade: "B2", min: 61, gp: 7 },
  { grade: "C1", min: 51, gp: 6 },  { grade: "C2", min: 41, gp: 5 },
  { grade: "D",  min: 33, gp: 4 },  { grade: "E1", min: 21, gp: 0 },
  { grade: "E2", min: 0,  gp: 0 },
];

/**
 * Live scale for the school being rendered. The PDF prints the school's own
 * GradeScale rows in the legend, so subject grades must come from the same
 * scale or the card contradicts itself.
 */
let SCALE: ScaleEntry[] = DEFAULT_SCALE;

function gradeFor(pct: number): ScaleEntry {
  const rounded = Math.round(pct);
  return SCALE.find((g) => rounded >= g.min) ?? SCALE[SCALE.length - 1];
}

function comp(shortName: string, componentName: string, maxMarks: number, obtainedMarks: number): ComponentMark {
  return { componentId: `${shortName}-${componentName}`.toLowerCase(), componentName, shortName, maxMarks, obtainedMarks, isAbsent: false };
}

/**
 * Primary / middle (Classes I–VIII): PT(10) + MA(5) + Portfolio(5) + Half Yearly|Annual(80)
 * per term, i.e. 100 per term and 200 for the year.
 */
function buildPrimaryTermSubject(
  rng: () => number,
  subject: DbSubject,
  ability: number,
  isFinalTerm: boolean,
): TermSubjectResult {
  const pt   = score(rng, 10, ability);
  const ma   = score(rng, 5, ability);
  const port = score(rng, 5, Math.min(0.98, ability + 0.08));
  const big  = score(rng, 80, ability);
  const total = pt + ma + port + big;
  const pct = total; // out of 100
  const g = gradeFor(pct);
  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    subjectType: subject.type,
    subjectCategory: subject.category,
    components: [
      comp("PT", "Periodic Test", 10, pt),
      comp("MA", "Multiple Assessment", 5, ma),
      comp("PORTFOLIO", "Portfolio", 5, port),
      isFinalTerm
        ? comp("ANNUAL", "Annual Exam", 80, big)
        : comp("HALF_YEARLY", "Half Yearly Exam", 80, big),
    ],
    theoryMarks: big, theoryMaxMarks: 80,
    practicalMarks: null, practicalMaxMarks: null,
    internalMarks: pt + ma + port, internalMaxMarks: 20,
    totalMarks: total, maxMarks: 100,
    percentage: pct, grade: g.grade, gradePoint: g.gp,
    isAbsent: false,
  };
}

/** Secondary (IX–X) and Senior (XI–XII): theory + practical/internal out of 100 */
function buildExamTermSubject(
  rng: () => number,
  subject: DbSubject,
  ability: number,
  level: "secondary" | "senior",
): TermSubjectResult {
  const theoryMax = level === "senior" ? (subject.hasPractical ? 70 : 80) : 80;
  const otherMax  = 100 - theoryMax;
  const theory = score(rng, theoryMax, ability);
  const other  = score(rng, otherMax, Math.min(0.98, ability + 0.1));
  const total = theory + other;
  const g = gradeFor(total);
  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    subjectType: subject.type,
    subjectCategory: subject.category,
    components: [
      comp("THEORY", "Theory", theoryMax, theory),
      subject.hasPractical
        ? comp("PRACTICAL", "Practical", otherMax, other)
        : comp("INTERNAL", "Internal Assessment", otherMax, other),
    ],
    theoryMarks: theory, theoryMaxMarks: theoryMax,
    practicalMarks: subject.hasPractical ? other : null,
    practicalMaxMarks: subject.hasPractical ? otherMax : null,
    internalMarks: subject.hasPractical ? null : other,
    internalMaxMarks: subject.hasPractical ? null : otherMax,
    totalMarks: total, maxMarks: 100,
    percentage: total, grade: g.grade, gradePoint: g.gp,
    isAbsent: false,
  };
}

/** Merge two term slices of the same subject into the annual row */
function mergeAnnual(a: TermSubjectResult, b: TermSubjectResult | null): TermSubjectResult {
  if (!b) return { ...a };
  const totalMarks = a.totalMarks + b.totalMarks;
  const maxMarks = a.maxMarks + b.maxMarks;
  const pct = (totalMarks / maxMarks) * 100;
  const g = gradeFor(pct);
  return {
    ...a,
    components: [...a.components, ...b.components],
    theoryMarks: (a.theoryMarks ?? 0) + (b.theoryMarks ?? 0),
    theoryMaxMarks: (a.theoryMaxMarks ?? 0) + (b.theoryMaxMarks ?? 0),
    practicalMarks: a.practicalMarks != null || b.practicalMarks != null ? (a.practicalMarks ?? 0) + (b.practicalMarks ?? 0) : null,
    practicalMaxMarks: a.practicalMaxMarks != null || b.practicalMaxMarks != null ? (a.practicalMaxMarks ?? 0) + (b.practicalMaxMarks ?? 0) : null,
    internalMarks: a.internalMarks != null || b.internalMarks != null ? (a.internalMarks ?? 0) + (b.internalMarks ?? 0) : null,
    internalMaxMarks: a.internalMaxMarks != null || b.internalMaxMarks != null ? (a.internalMaxMarks ?? 0) + (b.internalMaxMarks ?? 0) : null,
    totalMarks, maxMarks,
    percentage: pct, grade: g.grade, gradePoint: g.gp,
  };
}

function buildCoScholastic(
  rng: () => number,
  activities: Array<{ id: string; name: string; category: string }>,
): CoScholasticResult[] {
  return activities.map((a) => ({
    activityId: a.id,
    activityName: a.name,
    assessmentType: "GRADE" as const,
    grade: a.category === "SKILL_ACTIVITY"
      ? THREE_POINT[Math.min(THREE_POINT.length - 1, randInt(rng, 0, 1))]
      : FIVE_POINT[Math.min(FIVE_POINT.length - 1, randInt(rng, 0, 2))],
    marks: null,
    maxMarks: null,
    remarks: null,
    category: a.category,
  }));
}

function buildAttendance(rng: () => number, workingDays: number) {
  const daysAbsent  = randInt(rng, 2, 9);
  const daysLeave   = randInt(rng, 0, 3);
  const daysLate    = randInt(rng, 0, 4);
  const daysPresent = workingDays - daysAbsent - daysLeave;
  const percentage  = (daysPresent / workingDays) * 100;
  return {
    percentage: Number(percentage.toFixed(2)),
    daysPresent, totalDays: workingDays, daysAbsent, daysLate,
    daysHalfDay: 0, daysLeave,
    isLowAttendance: percentage < 75,
  };
}

function detectLevel(className: string): "primary" | "secondary" | "senior" {
  const m = className.match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  if (n >= 11) return "senior";
  if (n >= 9) return "secondary";
  return "primary";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("── Showcase CBSE report card generator (read-only) ──\n");

  // 1. School --------------------------------------------------------------
  const schools = await readOnlyDb.school.findMany({
    select: {
      id: true, name: true, schoolCode: true, address: true, phone: true,
      email: true, logo: true, _count: { select: { students: true } },
    },
  });
  const school = SCHOOL_ARG
    ? schools.find((s) => s.schoolCode === SCHOOL_ARG || s.id === SCHOOL_ARG)
    : schools.sort((a, b) => b._count.students - a._count.students)[0];
  if (!school) throw new Error(`School not found: ${SCHOOL_ARG}`);
  console.log(`School:  ${school.name} (${school.schoolCode}) — ${school._count.students} students`);

  // The renderer prints this school's GradeScale in the legend — use the same
  // rows for subject grades so the card is internally consistent.
  const dbScale = await readOnlyDb.gradeScale.findMany({
    where: { schoolId: school.id, boardType: "CBSE", isActive: true },
    orderBy: { minMarks: "desc" },
    select: { grade: true, minMarks: true, gradePoint: true, gpa: true },
  });
  if (dbScale.length > 0) {
    SCALE = dbScale.map((g) => ({ grade: g.grade, min: g.minMarks, gp: g.gradePoint ?? g.gpa ?? 0 }));
    console.log(`Scale:   ${SCALE.map((g) => `${g.grade}(${g.min}+)`).join(" ")}`);
  } else {
    console.log("Scale:   default CBSE 9-point (school has no GradeScale rows)");
  }

  const settings = await readOnlyDb.schoolSettings.findFirst({
    where: { schoolId: school.id },
    select: { schoolWebsite: true, affiliationNumber: true, schoolLogo: true, schoolPhone: true },
  });

  // 2. Academic year + terms ----------------------------------------------
  const academicYear =
    (await readOnlyDb.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true, startDate: true, endDate: true } })) ??
    (await readOnlyDb.academicYear.findFirst({ where: { schoolId: school.id }, orderBy: { startDate: "desc" }, select: { id: true, name: true, startDate: true, endDate: true } }));
  if (!academicYear) throw new Error("No academic year found for this school");

  const dbTerms = await readOnlyDb.term.findMany({
    where: { schoolId: school.id, academicYearId: academicYear.id },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });
  const terms = dbTerms.length >= 2 ? dbTerms.slice(0, 2) : [
    { id: "term-1", name: "Half Yearly", startDate: academicYear.startDate, endDate: academicYear.endDate },
    { id: "term-2", name: "Yearly",      startDate: academicYear.startDate, endDate: academicYear.endDate },
  ];
  console.log(`Year:    ${academicYear.name}  |  Terms: ${terms.map((t) => t.name).join(", ")}`);

  // 3. Co-scholastic activities -------------------------------------------
  const dbActivities = await readOnlyDb.coScholasticActivity.findMany({
    where: { schoolId: school.id },
    select: { id: true, name: true, category: true },
  });
  const activities = [
    ...dbActivities.map((a) => ({ id: a.id, name: a.name, category: String(a.category) })),
  ];
  if (!activities.some((a) => a.category !== "SKILL_ACTIVITY")) {
    activities.push(...DEFAULT_CO_SCHOLASTIC.map((a) => ({ id: `sample-${a.name}`, ...a })));
  }
  if (!activities.some((a) => a.category === "SKILL_ACTIVITY")) {
    activities.push(...DEFAULT_SKILL_ACTIVITIES.map((a) => ({ id: `sample-${a.name}`, ...a })));
  }

  // 4. Students ------------------------------------------------------------
  const studentSelect = {
    id: true, admissionId: true, rollNumber: true, dateOfBirth: true, gender: true,
    aadhaarNumber: true, height: true, weight: true,
    fatherName: true, fatherOccupation: true, fatherPhone: true,
    motherName: true, motherOccupation: true, motherPhone: true,
    guardianName: true, guardianRelation: true, guardianPhone: true,
    schoolId: true,
    user: { select: { firstName: true, lastName: true, avatar: true } },
    enrollments: {
      where: { status: "ACTIVE" as const },
      select: { class: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } },
      take: 1,
    },
  };

  type PickedStudent = Awaited<ReturnType<typeof readOnlyDb.student.findMany<{ select: typeof studentSelect }>>>[number];
  const picked: PickedStudent[] = [];

  if (ADMISSION_IDS.length > 0) {
    for (const adm of ADMISSION_IDS) {
      const s = await readOnlyDb.student.findFirst({
        where: { schoolId: school.id, admissionId: adm },
        select: studentSelect,
      });
      if (!s) { console.warn(`  ! No student with admission no. ${adm}`); continue; }
      picked.push(s);
    }
  } else {
    for (const className of CLASS_NAMES) {
      const cls = await readOnlyDb.class.findFirst({
        where: { schoolId: school.id, name: className, academicYearId: academicYear.id },
        select: { id: true, name: true },
      });
      if (!cls) { console.warn(`  ! Class not found: ${className}`); continue; }
      const rows = await readOnlyDb.student.findMany({
        where: {
          schoolId: school.id,
          enrollments: { some: { classId: cls.id, status: "ACTIVE" } },
          fatherName: { not: null },
          motherName: { not: null },
          rollNumber: { notIn: [""] },
        },
        orderBy: { rollNumber: "asc" },
        take: COUNT * 6,
        select: studentSelect,
      });
      // Prefer students who have a photo — a showcase card should not print an
      // empty photo box.
      const withPhoto = rows.filter((r) => r.user.avatar);
      const chosen = [...withPhoto, ...rows.filter((r) => !r.user.avatar)].slice(0, COUNT);
      if (chosen.length === 0) console.warn(`  ! No eligible students in ${className}`);
      picked.push(...chosen);
    }
  }

  if (picked.length === 0) throw new Error("No students matched — nothing to generate");

  // 5. Build report card data + render ------------------------------------
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const schoolOpts = {
    schoolName: school.name,
    schoolAddress: school.address ?? undefined,
    schoolPhone: school.phone ?? settings?.schoolPhone ?? undefined,
    schoolEmail: school.email ?? undefined,
    schoolWebsite: settings?.schoolWebsite ?? undefined,
    schoolLogo: school.logo ?? settings?.schoolLogo ?? undefined,
    affiliationNo: settings?.affiliationNumber ?? undefined,
    schoolCode: school.schoolCode ?? undefined,
  };

  const built: MultiTermReportCardData[] = [];

  for (const s of picked) {
    const enrollment = s.enrollments[0];
    if (!enrollment) { console.warn(`  ! ${s.admissionId}: no active enrollment, skipped`); continue; }

    const className = enrollment.class.name;
    const level = detectLevel(className);
    const classNum = Math.min(12, parseInt(className.match(/(\d+)/)?.[1] ?? "1", 10) || 1);
    const rng = makeRng(hashSeed(SEED, s.id));

    // Subjects taught to this class. Rows carrying a sectionId are stream-specific
    // (e.g. Class 12 Science vs Commerce) — keep only the student's own section
    // plus the class-wide rows, otherwise a senior card lists every stream at once.
    const subjectRows = await readOnlyDb.subjectClass.findMany({
      where: {
        classId: enrollment.class.id,
        OR: [{ sectionId: null }, { sectionId: enrollment.section?.id ?? undefined }],
      },
      orderBy: { order: "asc" },
      select: { subject: { select: { id: true, name: true, code: true, category: true, type: true, hasPractical: true } } },
    });
    const subjectMap = new Map<string, DbSubject>();
    for (const r of subjectRows) {
      subjectMap.set(r.subject.id, {
        ...r.subject,
        name: r.subject.name.trim(),
        category: String(r.subject.category),
        type: String(r.subject.type),
      });
    }
    const subjects = [...subjectMap.values()];
    if (subjects.length === 0) { console.warn(`  ! ${className}: no subjects mapped, skipped`); continue; }

    const scholastic = subjects.filter((x) => x.category !== "ADDITIONAL");
    const additional = subjects.filter((x) => x.category === "ADDITIONAL");

    // Overall ability for this student — 0.62 (steady) .. 0.95 (topper)
    const ability = 0.62 + rng() * 0.33;

    const termSlices: TermSlice[] = terms.map((t, ti) => {
      const isFinal = ti === terms.length - 1;
      const buildOne = (subj: DbSubject) => {
        // Jitter ability per subject so the grade column shows a realistic
        // spread instead of one flat band down the card.
        const subjAbility = Math.min(0.97, Math.max(0.45, ability + (rng() - 0.5) * 0.22));
        return level === "primary"
          ? buildPrimaryTermSubject(rng, subj, subjAbility, isFinal)
          : buildExamTermSubject(rng, subj, subjAbility, level);
      };
      return {
        term: {
          id: t.id, name: t.name, startDate: t.startDate, endDate: t.endDate,
          academicYear: academicYear.name,
        },
        subjects: [...scholastic, ...additional].map(buildOne),
        coScholastic: buildCoScholastic(rng, activities),
        attendance: buildAttendance(rng, ti === 0 ? randInt(rng, 102, 112) : randInt(rng, 108, 118)),
      };
    });

    const byId = (slice: TermSlice, id: string) => slice.subjects.find((x) => x.subjectId === id) ?? null;

    const annualFor = (list: DbSubject[]): TermSubjectResult[] =>
      list.map((subj) => {
        const t1 = byId(termSlices[0], subj.id)!;
        if (level === "primary") return mergeAnnual(t1, termSlices[1] ? byId(termSlices[1], subj.id) : null);
        // Secondary / senior cards show the annual (final term) result out of 100
        return byId(termSlices[termSlices.length - 1], subj.id) ?? t1;
      });

    const annualSubjects = annualFor(scholastic);
    const annualAdditionalSubjects = annualFor(additional);

    const obtainedMarks = annualSubjects.reduce((sum, x) => sum + x.totalMarks, 0);
    const maxMarks = annualSubjects.reduce((sum, x) => sum + x.maxMarks, 0);
    const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
    const g = gradeFor(percentage);
    const cgpa = annualSubjects.length
      ? Number((annualSubjects.reduce((sum, x) => sum + (x.gradePoint ?? 0), 0) / annualSubjects.length).toFixed(1))
      : null;

    const rawName = `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim();
    const displayName = ANONYMIZE ? `${pick(rng, SAMPLE_FIRST)} ${pick(rng, SAMPLE_LAST)}` : rawName;
    const fatherName = ANONYMIZE ? `${pick(rng, SAMPLE_FIRST)} ${pick(rng, SAMPLE_LAST)}` : s.fatherName;
    const motherName = ANONYMIZE ? `${pick(rng, SAMPLE_FIRST)} ${pick(rng, SAMPLE_LAST)}` : s.motherName;

    const student: StudentInfoExtended = {
      id: s.id,
      name: displayName || "Student Name",
      admissionId: s.admissionId,
      schoolId: s.schoolId,
      rollNumber: s.rollNumber?.trim() || String(randInt(rng, 1, 40)),
      dateOfBirth: s.dateOfBirth,
      class: className,
      section: enrollment.section?.name ?? "A",
      avatar: ANONYMIZE ? null : s.user.avatar,
      reportCardTemplateId: null,
      gender: s.gender,
      aadhaarNumber: ANONYMIZE ? null : s.aadhaarNumber,
      // Height/weight are rarely captured — fill with values scaled to the
      // student's class so the showcase card has no blank (or absurd) cells.
      height: s.height ?? randInt(rng, 108 + classNum * 4, 116 + classNum * 4),
      weight: s.weight ?? randInt(rng, 18 + classNum * 3, 24 + classNum * 3),
      parent: {
        fatherName: fatherName ?? "-",
        fatherOccupation: s.fatherOccupation ?? pick(rng, OCCUPATIONS),
        fatherPhone: s.fatherPhone ?? `+91 9${randInt(rng, 100000000, 899999999)}`,
        motherName: motherName ?? "-",
        motherOccupation: s.motherOccupation ?? "Homemaker",
        motherPhone: s.motherPhone ?? null,
        guardianName: s.guardianName ?? fatherName ?? null,
        guardianRelation: s.guardianRelation ?? "Father",
        guardianPhone: s.guardianPhone ?? s.fatherPhone ?? null,
      },
    };

    const data: MultiTermReportCardData = {
      student,
      academicYear: academicYear.name,
      academicYearId: academicYear.id,
      terms: termSlices,
      annualSubjects,
      annualAdditionalSubjects,
      overallPerformance: {
        totalMarks: maxMarks,
        maxMarks,
        obtainedMarks,
        percentage: Number(percentage.toFixed(2)),
        grade: g.grade,
        cgpa,
        rank: randInt(rng, 1, 5),
      },
      resultStatus: calculateResultStatus(annualSubjects),
      remarks: {
        teacherRemarks: pick(rng, TEACHER_REMARKS),
        principalRemarks: pick(rng, PRINCIPAL_REMARKS),
      },
      templateId: null,
      pdfUrl: null,
      isPublished: false,
      publishDate: null,
    };

    built.push(data);

    const pdf = await runWithTenantContext({ schoolId: school.id, isSuperAdmin: false }, () =>
      generateCBSEReportCardPDF(data, schoolOpts),
    );
    const safeName = data.student.name.replace(/[^A-Za-z0-9]+/g, "_");
    const file = path.join(OUT_DIR, `Showcase_${className.replace(/\s+/g, "")}_${safeName}.pdf`);
    fs.writeFileSync(file, pdf);
    console.log(
      `  ✓ ${className.padEnd(9)} ${data.student.name.padEnd(22)} ` +
      `${obtainedMarks}/${maxMarks}  ${percentage.toFixed(2)}%  ${g.grade}  ${data.resultStatus}  →  ${path.relative(process.cwd(), file)}`,
    );
  }

  // 6. Combined multi-page showcase PDF ------------------------------------
  if (built.length > 1) {
    const batch = await runWithTenantContext({ schoolId: school.id, isSuperAdmin: false }, () =>
      generateBatchCBSEReportCards(built, schoolOpts),
    );
    const combined = path.join(OUT_DIR, "Showcase_Report_Cards.pdf");
    fs.writeFileSync(combined, batch);
    console.log(`\n  ✓ Combined (${built.length} pages) → ${path.relative(process.cwd(), combined)}`);
  }

  console.log(`\nDone. Marks, grades, attendance and remarks are synthetic (seed ${SEED}). No database rows were written.`);
}

main()
  .catch((e) => {
    console.error("\nFailed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await readOnlyDb.$disconnect();
  });
