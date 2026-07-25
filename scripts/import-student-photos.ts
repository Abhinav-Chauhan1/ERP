#!/usr/bin/env ts-node

/**
 * Bulk Student Photo Import Script
 *
 * Matches a legacy-system xlsx export (Photo No. / Name / Father Name / Mother
 * Name / Class / Contact) against ERP students by name (confirmed by class,
 * parent name, or phone when names collide), then uploads the corresponding
 * cropped photo to R2 and sets it as the student's avatar.
 *
 * Default mode is REPORT-ONLY — nothing is written to R2 or the database
 * unless --apply is passed. This is a deliberate inversion of this repo's
 * usual --dry-run-to-opt-in-safety convention, because this script touches
 * production storage and real student records.
 *
 * Usage:
 *   npx tsx scripts/import-student-photos.ts --xlsx <path> --photo-dir <path>
 *   npx tsx scripts/import-student-photos.ts --xlsx <path> --photo-dir <path> --apply
 *   npx tsx scripts/import-student-photos.ts --help
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { parse as parseCSV } from 'csv-parse/sync';
import { stringify as stringifyCSV } from 'csv-stringify/sync';
import { uploadHandler } from '../src/lib/services/upload-handler';

const prisma = new PrismaClient();

const DEFAULT_SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'; // Howard Convent School
const DEFAULT_ACTOR_ID = 'bulk-photo-import-script';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

interface CliArgs {
  apply: boolean;
  force: boolean;
  schoolId: string;
  xlsxPath: string | null;
  photoDir: string | null;
  overrideFile: string | null;
  limit: number | null;
  actorEmail: string | null;
  help: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const get = (flag: string): string | null => {
    const idx = argv.indexOf(flag);
    return idx !== -1 && idx + 1 < argv.length ? argv[idx + 1] : null;
  };

  const limitRaw = get('--limit');

  return {
    apply: argv.includes('--apply'),
    force: argv.includes('--force') || argv.includes('--overwrite'),
    schoolId: get('--school-id') || DEFAULT_SCHOOL_ID,
    xlsxPath: get('--xlsx'),
    photoDir: get('--photo-dir'),
    overrideFile: get('--override-file'),
    limit: limitRaw ? parseInt(limitRaw, 10) : null,
    actorEmail: get('--actor-email'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function displayHelp(): void {
  console.log(`
Bulk Student Photo Import Script
=================================

Matches a legacy xlsx export (Photo No./Name/Father/Mother/Class/Contact) to
ERP students and uploads matching photos as avatars.

Default mode is REPORT-ONLY. Nothing is written until you pass --apply.

Usage:
  npx tsx scripts/import-student-photos.ts --xlsx <path> --photo-dir <path> [options]

Required:
  --xlsx <path>          Path to the legacy xlsx export
  --photo-dir <path>     Directory containing <PhotoNo>.png files

Options:
  --apply                Actually upload photos and update student records
  --force                Also overwrite students that already have an avatar
  --school-id <id>       Target school (default: Howard Convent School)
  --override-file <path> CSV with photoNo,overrideAdmissionId for manual matches
  --limit <n>             Only process the first N eligible rows (for smoke-testing --apply)
  --actor-email <email>  Admin email to attribute uploads to (for R2 metadata)
  --help, -h             Show this help

Examples:
  # Report-only run, review the CSVs under logs/ before trusting it
  npx tsx scripts/import-student-photos.ts --xlsx "Howard 26-27 (1).xlsx" --photo-dir ./CroppedImages

  # Smoke-test a real write on 3 rows
  npx tsx scripts/import-student-photos.ts --xlsx ... --photo-dir ... --apply --limit 3

  # Full apply run
  npx tsx scripts/import-student-photos.ts --xlsx ... --photo-dir ... --apply

  # After hand-filling the not-found report's overrideAdmissionId column
  npx tsx scripts/import-student-photos.ts --xlsx ... --photo-dir ... --apply --override-file logs/photo-import-not-found-....csv
  `);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRow {
  sheetName: string;
  photoNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  classRaw: string;
  contactNo: string;
}

interface StudentRecord {
  id: string;
  userId: string;
  admissionId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  fatherName: string | null;
  motherName: string | null;
  phones: string[];
  className: string | null;
  sectionName: string | null;
}

interface ClassSectionInfo {
  classId: string;
  sections: string[]; // real ClassSection.name values for this class
}

type MatchCategory = 'AUTO_MATCH' | 'OVERRIDE_MATCH' | 'AMBIGUOUS' | 'NOT_FOUND';
type MatchTier =
  | 'override'
  | 'exact'
  | 'name+class'
  | 'name+parent'
  | 'name+phone'
  | 'fuzzy+class'
  | 'none';

interface MatchResult {
  row: RawRow;
  category: MatchCategory;
  tier: MatchTier;
  matchedStudent: StudentRecord | null;
  candidates: StudentRecord[]; // populated for AMBIGUOUS
  fuzzyBestGuess: StudentRecord | null; // populated for NOT_FOUND, informational only
  resolvedClassName: string | null;
  resolvedSectionName: string | null;
  imageFileExists: boolean;
  alreadyHasAvatar: boolean;
  reason: string;
}

interface UploadOutcome {
  row: RawRow;
  matchedStudent: StudentRecord;
  action: 'UPLOADED' | 'SKIPPED_HAS_AVATAR' | 'SKIPPED_NO_IMAGE' | 'FAILED';
  r2Key?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Phase 1: parse xlsx + load indexes
// ---------------------------------------------------------------------------

async function loadWorkbookRows(xlsxPath: string): Promise<RawRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);

  const rows: RawRow[] = [];

  wb.eachSheet((ws) => {
    const headerRow = ws.getRow(1);
    const headerIndex = new Map<string, number>();
    headerRow.eachCell((cell, colNumber) => {
      const text = (cell.value || '').toString().trim().toLowerCase();
      if (text) headerIndex.set(text, colNumber);
    });

    const col = (...names: string[]): number | undefined => {
      for (const n of names) {
        const idx = headerIndex.get(n.toLowerCase());
        if (idx) return idx;
      }
      return undefined;
    };

    const photoNoCol = col('photo no.', 'photo no');
    const nameCol = col('name');
    const fatherCol = col('fathers name', "father's name", 'fathers name ');
    const motherCol = col('mother name', "mother's name");
    const classCol = col('class');
    const contactCol = col('cont. no.', 'cont no.', 'contact no.');

    if (!photoNoCol || !nameCol) {
      console.warn(`  Skipping sheet "${ws.name}": missing Photo No./Name columns`);
      return;
    }

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // header
      const cell = (colNumber: number | undefined): string => {
        if (!colNumber) return '';
        const v = row.getCell(colNumber).value;
        if (v === null || v === undefined) return '';
        if (typeof v === 'object' && 'text' in (v as any)) return (v as any).text?.toString().trim() || '';
        return v.toString().trim();
      };

      const photoNo = cell(photoNoCol);
      const name = cell(nameCol);
      if (!photoNo || !name) return;

      rows.push({
        sheetName: ws.name,
        photoNo,
        name,
        fatherName: cell(fatherCol),
        motherName: cell(motherCol),
        classRaw: cell(classCol),
        contactNo: cell(contactCol),
      });
    });
  });

  return rows;
}

async function loadStudentIndex(schoolId: string): Promise<StudentRecord[]> {
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      user: true,
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { class: true, section: true },
        take: 1,
      },
    },
  });

  return students.map((s) => {
    const enrollment = s.enrollments[0];
    const phones = [s.phone, s.fatherPhone, s.motherPhone, s.guardianPhone, s.parentMobile, s.emergencyPhone]
      .filter((p): p is string => !!p)
      .map(digitsOnly)
      .filter((p) => p.length > 0);

    return {
      id: s.id,
      userId: s.userId,
      admissionId: s.admissionId,
      firstName: s.user.firstName || '',
      lastName: s.user.lastName || '',
      avatar: s.user.avatar,
      fatherName: s.fatherName,
      motherName: s.motherName,
      phones,
      className: enrollment?.class.name || null,
      sectionName: enrollment?.section.name || null,
    };
  });
}

async function loadClassSectionMap(schoolId: string): Promise<Map<string, ClassSectionInfo>> {
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: { sections: true },
  });

  const map = new Map<string, ClassSectionInfo>();
  for (const c of classes) {
    map.set(c.name.toLowerCase(), {
      classId: c.id,
      sections: c.sections.map((s) => s.name),
    });
  }
  return map;
}

interface OverrideEntry {
  photoNo: string;
  admissionId: string;
}

function loadOverrideMap(overrideFilePath: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!overrideFilePath) return map;

  if (!fs.existsSync(overrideFilePath)) {
    throw new Error(`Override file not found: ${overrideFilePath}`);
  }

  const content = fs.readFileSync(overrideFilePath, 'utf-8');
  const records: Record<string, string>[] = parseCSV(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  for (const rec of records) {
    const photoNo = (rec.photoNo || '').toString().trim();
    const admissionId = (rec.overrideAdmissionId || rec.admissionId || '').toString().trim();
    if (photoNo && admissionId) {
      map.set(photoNo, admissionId);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Phase 2: matching
// ---------------------------------------------------------------------------

function normalizeStrict(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[.,'’]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common Indian-Muslim-name transliteration clusters. Extend empirically as
// unmatched names are reviewed — not meant to be exhaustive up front.
const FUZZY_TOKEN_MAP: Record<string, string> = {
  MOHD: 'MOHAMMAD',
  MOHMAD: 'MOHAMMAD',
  MOHAMAD: 'MOHAMMAD',
  MOHAMMED: 'MOHAMMAD',
  MUHAMMAD: 'MOHAMMAD',
  MOHMMED: 'MOHAMMAD',
  MD: 'MOHAMMAD',
  AHMED: 'AHMAD',
};

function normalizeFuzzy(name: string): string {
  const strict = normalizeStrict(name);
  const tokens = strict.split(' ').map((t) => FUZZY_TOKEN_MAP[t] || t);
  return tokens.join(' ');
}

function digitsOnly(s: string): string {
  return (s || '').replace(/\D/g, '');
}

function phonesMatch(a: string[], bRaw: string): boolean {
  const bDigits = digitsOnly(bRaw);
  if (bDigits.length < 6) return false;
  const bLast10 = bDigits.slice(-10);
  return a.some((p) => p.slice(-10) === bLast10);
}

const ORDINAL_CLASS_RE = /^(\d{1,2})\s*(?:ST|ND|RD|TH)?\s*-?\s*(.*)$/;

function normalizeClass(raw: string): { className: string | null; sectionRaw: string | null } {
  if (!raw) return { className: null, sectionRaw: null };
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  // Reject obvious garbage (e.g. a phone number that ended up in the Class cell)
  if (/^\d{7,}$/.test(cleaned.replace(/\D/g, '')) && cleaned.replace(/\D/g, '').length >= 7 && !/[A-Z]/.test(cleaned)) {
    return { className: null, sectionRaw: null };
  }

  // Pre-primary classes, tolerate the "UIKG" typo seen in the source data
  if (/^NURSERY/.test(cleaned)) return splitTrailingSection(cleaned, 'NURSERY');
  if (/^U?I?KG/.test(cleaned) && /KG/.test(cleaned)) {
    if (/^L/.test(cleaned)) return splitTrailingSection(cleaned, 'LKG');
    return splitTrailingSection(cleaned, 'UKG');
  }

  const match = cleaned.match(ORDINAL_CLASS_RE);
  if (match) {
    const num = match[1];
    let rest = match[2].replace(/^-+/, '').trim();
    rest = rest.replace(/^-+|-+$/g, '').trim();
    return { className: `Class ${parseInt(num, 10)}`, sectionRaw: rest || null };
  }

  return { className: null, sectionRaw: null };
}

function splitTrailingSection(cleaned: string, base: string): { className: string; sectionRaw: string | null } {
  const rest = cleaned.replace(/^[A-Z]+/, '').replace(/^-+/, '').trim();
  return { className: base, sectionRaw: rest || null };
}

function resolveClassSection(
  raw: string,
  classMap: Map<string, ClassSectionInfo>
): { className: string | null; sectionName: string | null } {
  const { className, sectionRaw } = normalizeClass(raw);
  if (!className) return { className: null, sectionName: null };

  const info = classMap.get(className.toLowerCase());
  if (!info) return { className: null, sectionName: null }; // parsed but doesn't exist in ERP

  let sectionName: string | null = null;
  if (sectionRaw) {
    const found = info.sections.find((s) => s.trim().toUpperCase() === sectionRaw.toUpperCase());
    sectionName = found || null; // best-effort; null rather than guessing
  }

  return { className, sectionName };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function fullName(s: StudentRecord): string {
  return `${s.firstName} ${s.lastName}`.trim();
}

function matchRow(
  row: RawRow,
  studentsByStrict: Map<string, StudentRecord[]>,
  studentsByFuzzy: Map<string, StudentRecord[]>,
  allStudents: StudentRecord[],
  studentsByAdmissionId: Map<string, StudentRecord>,
  classMap: Map<string, ClassSectionInfo>,
  overrideMap: Map<string, string>,
  photoDir: string
): MatchResult {
  const imageFileExists = fs.existsSync(path.join(photoDir, `${row.photoNo}.png`));
  const { className: resolvedClassName, sectionName: resolvedSectionName } = resolveClassSection(row.classRaw, classMap);

  const base: Omit<MatchResult, 'category' | 'tier' | 'matchedStudent' | 'candidates' | 'fuzzyBestGuess' | 'reason'> = {
    row,
    resolvedClassName,
    resolvedSectionName,
    imageFileExists,
    alreadyHasAvatar: false,
  };

  // 0. Override
  const overrideAdmissionId = overrideMap.get(row.photoNo);
  if (overrideAdmissionId) {
    const student = studentsByAdmissionId.get(overrideAdmissionId);
    if (student) {
      return {
        ...base,
        category: 'OVERRIDE_MATCH',
        tier: 'override',
        matchedStudent: student,
        candidates: [],
        fuzzyBestGuess: null,
        alreadyHasAvatar: !!student.avatar,
        reason: `Manual override to admission ID ${overrideAdmissionId}`,
      };
    }
    // override present but admissionId doesn't resolve — fall through, will be reported
  }

  const strictKey = normalizeStrict(row.name);
  const strictCandidates = studentsByStrict.get(strictKey) || [];

  if (strictCandidates.length === 1) {
    const student = strictCandidates[0];
    return {
      ...base,
      category: 'AUTO_MATCH',
      tier: 'exact',
      matchedStudent: student,
      candidates: [],
      fuzzyBestGuess: null,
      alreadyHasAvatar: !!student.avatar,
      reason: 'Unique exact name match',
    };
  }

  if (strictCandidates.length > 1) {
    // Disambiguate: class -> parent name -> phone
    let survivors = strictCandidates;
    let tier: MatchTier = 'exact';

    if (resolvedClassName) {
      const byClass = survivors.filter(
        (s) =>
          s.className === resolvedClassName &&
          (!resolvedSectionName || s.sectionName === resolvedSectionName)
      );
      if (byClass.length === 1) {
        survivors = byClass;
        tier = 'name+class';
      } else if (byClass.length > 1) {
        survivors = byClass; // narrowed but still ambiguous
      }
    }

    if (survivors.length > 1) {
      const byParent = survivors.filter((s) => {
        const fatherOk =
          row.fatherName && s.fatherName && normalizeStrict(s.fatherName).includes(normalizeStrict(row.fatherName).split(' ').pop() || ' ');
        const motherOk =
          row.motherName && s.motherName && normalizeStrict(s.motherName).includes(normalizeStrict(row.motherName).split(' ').pop() || ' ');
        return fatherOk || motherOk;
      });
      if (byParent.length === 1) {
        survivors = byParent;
        tier = 'name+parent';
      }
    }

    if (survivors.length > 1 && row.contactNo) {
      const byPhone = survivors.filter((s) => phonesMatch(s.phones, row.contactNo));
      if (byPhone.length === 1) {
        survivors = byPhone;
        tier = 'name+phone';
      }
    }

    if (survivors.length === 1) {
      const student = survivors[0];
      return {
        ...base,
        category: 'AUTO_MATCH',
        tier,
        matchedStudent: student,
        candidates: [],
        fuzzyBestGuess: null,
        alreadyHasAvatar: !!student.avatar,
        reason: `Disambiguated from ${strictCandidates.length} name collisions via ${tier}`,
      };
    }

    return {
      ...base,
      category: 'AMBIGUOUS',
      tier: 'none',
      matchedStudent: null,
      candidates: strictCandidates,
      fuzzyBestGuess: null,
      reason: `${strictCandidates.length} students share this name; could not disambiguate`,
    };
  }

  // No exact match at all — try fuzzy, but only auto-match if class independently confirms it
  const fuzzyKey = normalizeFuzzy(row.name);
  const fuzzyCandidates = studentsByFuzzy.get(fuzzyKey) || [];

  if (fuzzyCandidates.length === 1) {
    const student = fuzzyCandidates[0];
    const classConfirms = !!resolvedClassName && student.className === resolvedClassName;
    if (classConfirms) {
      return {
        ...base,
        category: 'AUTO_MATCH',
        tier: 'fuzzy+class',
        matchedStudent: student,
        candidates: [],
        fuzzyBestGuess: null,
        alreadyHasAvatar: !!student.avatar,
        reason: 'Fuzzy name match confirmed by matching class',
      };
    }
    return {
      ...base,
      category: 'NOT_FOUND',
      tier: 'none',
      matchedStudent: null,
      candidates: [],
      fuzzyBestGuess: student,
      reason: 'Fuzzy name match found but class did not confirm it — needs manual review',
    };
  }

  // 0 or 2+ fuzzy candidates: no auto-match. Offer closest-by-edit-distance as an
  // informational best guess only (never auto-applied).
  let bestGuess: StudentRecord | null = null;
  let bestDist = Infinity;
  const targetFull = normalizeFuzzy(row.name);
  for (const s of allStudents) {
    const dist = levenshtein(targetFull, normalizeFuzzy(fullName(s)));
    if (dist < bestDist) {
      bestDist = dist;
      bestGuess = s;
    }
  }
  const guessIsClose = bestGuess && bestDist <= Math.max(2, Math.floor(targetFull.length * 0.2));

  return {
    ...base,
    category: 'NOT_FOUND',
    tier: 'none',
    matchedStudent: null,
    candidates: [],
    fuzzyBestGuess: guessIsClose ? bestGuess : null,
    reason: fuzzyCandidates.length > 1 ? 'Multiple fuzzy candidates, none confirmed by class' : 'No name match found',
  };
}

// ---------------------------------------------------------------------------
// Phase 3: report
// ---------------------------------------------------------------------------

interface ReportSummary {
  total: number;
  byTier: Record<string, number>;
  ambiguous: number;
  notFound: number;
  missingImage: number;
  alreadyHasAvatar: number;
}

function buildSummary(results: MatchResult[]): ReportSummary {
  const byTier: Record<string, number> = {};
  let ambiguous = 0;
  let notFound = 0;
  let missingImage = 0;
  let alreadyHasAvatar = 0;

  for (const r of results) {
    if (r.category === 'AUTO_MATCH' || r.category === 'OVERRIDE_MATCH') {
      const key = r.category === 'OVERRIDE_MATCH' ? 'override' : r.tier;
      byTier[key] = (byTier[key] || 0) + 1;
      if (r.alreadyHasAvatar) alreadyHasAvatar++;
    } else if (r.category === 'AMBIGUOUS') {
      ambiguous++;
    } else {
      notFound++;
    }
    if (!r.imageFileExists) missingImage++;
  }

  return { total: results.length, byTier, ambiguous, notFound, missingImage, alreadyHasAvatar };
}

function printSummaryTable(summary: ReportSummary): void {
  console.log('='.repeat(80));
  console.log(`PHOTO IMPORT — MATCH SUMMARY (${summary.total} xlsx rows)`);
  console.log('='.repeat(80));
  const tierLabels: Record<string, string> = {
    exact: 'Auto-match (exact)',
    'name+class': 'Auto-match (name+class)',
    'name+parent': 'Auto-match (name+parent)',
    'name+phone': 'Auto-match (name+phone)',
    'fuzzy+class': 'Auto-match (fuzzy+class)',
    override: 'Override (manual mapping)',
  };
  for (const [tier, count] of Object.entries(summary.byTier)) {
    console.log(`  ${(tierLabels[tier] || tier).padEnd(30)}: ${count}`);
  }
  console.log(`  ${'Ambiguous (needs human pick)'.padEnd(30)}: ${summary.ambiguous}`);
  console.log(`  ${'Not found'.padEnd(30)}: ${summary.notFound}`);
  console.log('-'.repeat(80));
  console.log(`  ${'Missing image file on disk'.padEnd(30)}: ${summary.missingImage}`);
  console.log(`  ${'Already has avatar'.padEnd(30)}: ${summary.alreadyHasAvatar} (subset of matches; skipped unless --force)`);
  console.log('='.repeat(80));
}

function writeReports(results: MatchResult[]): { reportPath: string; ambiguousPath: string; notFoundPath: string } {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  const mainRows = results.map((r) => ({
    photoNo: r.row.photoNo,
    sourceSheet: r.row.sheetName,
    xlsxName: r.row.name,
    xlsxClassRaw: r.row.classRaw,
    resolvedClassName: r.resolvedClassName || '',
    resolvedSectionName: r.resolvedSectionName || '',
    category: r.category,
    matchTier: r.tier,
    matchedAdmissionId: r.matchedStudent?.admissionId || '',
    matchedStudentName: r.matchedStudent ? fullName(r.matchedStudent) : '',
    candidateCount: r.candidates.length,
    imageFileExists: r.imageFileExists,
    alreadyHasAvatar: r.alreadyHasAvatar,
    reason: r.reason,
  }));
  const reportPath = path.join(logsDir, `photo-import-report-${ts}.csv`);
  fs.writeFileSync(reportPath, stringifyCSV(mainRows, { header: true }), 'utf-8');

  const ambiguousRows: Record<string, any>[] = [];
  for (const r of results.filter((r) => r.category === 'AMBIGUOUS')) {
    for (const c of r.candidates) {
      ambiguousRows.push({
        photoNo: r.row.photoNo,
        xlsxName: r.row.name,
        xlsxClassRaw: r.row.classRaw,
        xlsxFatherName: r.row.fatherName,
        xlsxMotherName: r.row.motherName,
        xlsxContNo: r.row.contactNo,
        candidateAdmissionId: c.admissionId,
        candidateName: fullName(c),
        candidateClass: c.className || '',
        candidateSection: c.sectionName || '',
        candidateFatherName: c.fatherName || '',
        candidateMotherName: c.motherName || '',
        candidatePhone: c.phones[0] || '',
      });
    }
  }
  const ambiguousPath = path.join(logsDir, `photo-import-ambiguous-${ts}.csv`);
  fs.writeFileSync(ambiguousPath, stringifyCSV(ambiguousRows, { header: true }), 'utf-8');

  const notFoundRows = results
    .filter((r) => r.category === 'NOT_FOUND')
    .map((r) => ({
      photoNo: r.row.photoNo,
      xlsxName: r.row.name,
      xlsxClassRaw: r.row.classRaw,
      xlsxFatherName: r.row.fatherName,
      fuzzyBestGuessAdmissionId: r.fuzzyBestGuess?.admissionId || '',
      fuzzyBestGuessName: r.fuzzyBestGuess ? fullName(r.fuzzyBestGuess) : '',
      overrideAdmissionId: '',
    }));
  const notFoundPath = path.join(logsDir, `photo-import-not-found-${ts}.csv`);
  fs.writeFileSync(notFoundPath, stringifyCSV(notFoundRows, { header: true }), 'utf-8');

  return { reportPath, ambiguousPath, notFoundPath };
}

// ---------------------------------------------------------------------------
// Phase 4: apply
// ---------------------------------------------------------------------------

async function resolveActorId(actorEmail: string | null): Promise<string> {
  if (!actorEmail) return DEFAULT_ACTOR_ID;
  const user = await prisma.user.findUnique({ where: { email: actorEmail } });
  return user?.id || DEFAULT_ACTOR_ID;
}

async function applyUploads(
  results: MatchResult[],
  args: CliArgs,
  photoDir: string,
  actorId: string
): Promise<UploadOutcome[]> {
  const eligible = results.filter(
    (r) => (r.category === 'AUTO_MATCH' || r.category === 'OVERRIDE_MATCH') && r.matchedStudent
  );

  const toProcess = args.limit ? eligible.slice(0, args.limit) : eligible;
  const outcomes: UploadOutcome[] = [];
  let processed = 0;

  for (const r of toProcess) {
    const student = r.matchedStudent!;
    processed++;

    if (!r.imageFileExists) {
      outcomes.push({ row: r.row, matchedStudent: student, action: 'SKIPPED_NO_IMAGE' });
      continue;
    }
    if (student.avatar && !args.force) {
      outcomes.push({ row: r.row, matchedStudent: student, action: 'SKIPPED_HAS_AVATAR' });
      continue;
    }

    try {
      const filePath = path.join(photoDir, `${r.row.photoNo}.png`);
      const buffer = fs.readFileSync(filePath);
      const fileInput = {
        name: `${r.row.photoNo}.png`,
        size: buffer.length,
        type: 'image/png',
        arrayBuffer: async () =>
          buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
      };

      const uploadResult = await uploadHandler.uploadImage(
        fileInput,
        {
          folder: 'avatars',
          category: 'image',
          customMetadata: {
            userId: student.userId,
            studentId: student.id,
            uploadType: 'avatar',
            source: 'bulk-photo-import',
            photoNo: r.row.photoNo,
            matchTier: r.tier,
          },
        },
        { schoolId: args.schoolId, userId: actorId, folder: 'avatars' }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      if (!uploadResult.key && (!uploadResult.url || uploadResult.url === '' || uploadResult.url.includes('undefined'))) {
        throw new Error('R2 storage returned an invalid URL. Check R2 environment variables.');
      }

      const avatarUrl = uploadResult.key
        ? `/api/r2/image?key=${encodeURIComponent(uploadResult.key)}`
        : uploadResult.url!;

      await prisma.student.update({
        where: { id: student.id },
        data: { user: { update: { avatar: avatarUrl } } },
      });

      outcomes.push({ row: r.row, matchedStudent: student, action: 'UPLOADED', r2Key: uploadResult.key });
    } catch (error: any) {
      outcomes.push({
        row: r.row,
        matchedStudent: student,
        action: 'FAILED',
        error: error?.message || 'Unknown error',
      });
      console.error(`  FAILED photo ${r.row.photoNo} -> ${student.admissionId}: ${error?.message}`);
    }

    if (processed % 20 === 0) {
      console.log(`  Processed ${processed}/${toProcess.length}...`);
    }
  }

  return outcomes;
}

function printUploadResults(outcomes: UploadOutcome[]): void {
  const uploaded = outcomes.filter((o) => o.action === 'UPLOADED').length;
  const skippedAvatar = outcomes.filter((o) => o.action === 'SKIPPED_HAS_AVATAR').length;
  const skippedNoImage = outcomes.filter((o) => o.action === 'SKIPPED_NO_IMAGE').length;
  const failed = outcomes.filter((o) => o.action === 'FAILED').length;

  console.log('='.repeat(80));
  console.log('UPLOAD RESULTS');
  console.log('='.repeat(80));
  console.log(`  Eligible for upload           : ${outcomes.length}`);
  console.log(`  Uploaded to R2 + DB updated    : ${uploaded}`);
  console.log(`  Skipped (already has avatar)  : ${skippedAvatar}`);
  console.log(`  Skipped (image missing)       : ${skippedNoImage}`);
  console.log(`  Failed                        : ${failed}`);
  console.log('='.repeat(80));

  if (failed > 0) {
    console.log('\nFailures:');
    for (const o of outcomes.filter((o) => o.action === 'FAILED')) {
      console.log(`  - photo ${o.row.photoNo} (${o.matchedStudent.admissionId}): ${o.error}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  if (args.help) {
    displayHelp();
    return;
  }

  if (!args.xlsxPath || !args.photoDir) {
    console.error('Error: --xlsx and --photo-dir are required. Run with --help for usage.');
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(args.xlsxPath)) {
    console.error(`Error: xlsx file not found: ${args.xlsxPath}`);
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(args.photoDir) || !fs.statSync(args.photoDir).isDirectory()) {
    console.error(`Error: photo directory not found: ${args.photoDir}`);
    process.exitCode = 1;
    return;
  }

  const school = await prisma.school.findUnique({ where: { id: args.schoolId } });
  if (!school) {
    console.error(`Error: no school found with id ${args.schoolId}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Target school: ${school.name} (${school.id})`);

  console.log('\nParsing xlsx...');
  const rows = await loadWorkbookRows(args.xlsxPath);
  console.log(`  Found ${rows.length} rows across all sheets.`);

  console.log('Loading student index...');
  const students = await loadStudentIndex(args.schoolId);
  console.log(`  Loaded ${students.length} students.`);

  const classMap = await loadClassSectionMap(args.schoolId);

  let overrideMap = new Map<string, string>();
  try {
    overrideMap = loadOverrideMap(args.overrideFile);
    if (args.overrideFile) console.log(`  Loaded ${overrideMap.size} overrides from ${args.overrideFile}`);
  } catch (error: any) {
    console.error(`Error loading override file: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  // Validate override admission IDs up front — a typo silently pointing at the
  // wrong student is the worst-case failure mode here.
  const studentsByAdmissionId = new Map(students.map((s) => [s.admissionId, s]));
  if (overrideMap.size > 0) {
    const invalid = [...overrideMap.entries()].filter(([, admissionId]) => !studentsByAdmissionId.has(admissionId));
    if (invalid.length > 0) {
      console.error(`Error: override file references ${invalid.length} admission ID(s) not found in this school:`);
      for (const [photoNo, admissionId] of invalid.slice(0, 10)) {
        console.error(`  photo ${photoNo} -> ${admissionId}`);
      }
      process.exitCode = 1;
      return;
    }
  }

  const studentsByStrict = new Map<string, StudentRecord[]>();
  const studentsByFuzzy = new Map<string, StudentRecord[]>();
  for (const s of students) {
    const strictKey = normalizeStrict(fullName(s));
    const fuzzyKey = normalizeFuzzy(fullName(s));
    if (!studentsByStrict.has(strictKey)) studentsByStrict.set(strictKey, []);
    studentsByStrict.get(strictKey)!.push(s);
    if (!studentsByFuzzy.has(fuzzyKey)) studentsByFuzzy.set(fuzzyKey, []);
    studentsByFuzzy.get(fuzzyKey)!.push(s);
  }

  console.log('Matching rows...\n');
  const results = rows.map((row) =>
    matchRow(row, studentsByStrict, studentsByFuzzy, students, studentsByAdmissionId, classMap, overrideMap, args.photoDir!)
  );

  const summary = buildSummary(results);
  printSummaryTable(summary);

  const { reportPath, ambiguousPath, notFoundPath } = writeReports(results);
  console.log('\nReports written:');
  console.log(`  ${reportPath}`);
  console.log(`  ${ambiguousPath}`);
  console.log(`  ${notFoundPath}`);

  if (!args.apply) {
    console.log('\nReport-only run complete. Re-run with --apply to upload photos and update records.');
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('APPLY MODE — uploading photos and updating student records');
  console.log('='.repeat(80));

  const actorId = await resolveActorId(args.actorEmail);
  const outcomes = await applyUploads(results, args, args.photoDir, actorId);
  printUploadResults(outcomes);

  if (outcomes.some((o) => o.action === 'FAILED')) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
