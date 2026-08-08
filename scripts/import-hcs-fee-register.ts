/**
 * One-time import of Howard Convent School's per-student "amount due this
 * year" fee register into FeeTypeStudentAmount, from the Excel master sheet.
 *
 * Usage:
 *   npx tsx scripts/import-hcs-fee-register.ts --file "/path/to/register.xlsx" [--apply]
 *
 * Without --apply this only prints match/skip counts and writes the
 * unmatched-rows CSV report — no database writes happen.
 */
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const HCS_SCHOOL_ID = "cmpavpvbu000nog4o78c6q1u5"; // Howard Convent School

// Excel sheet name -> ERP Class.name
const CLASS_SHEET_MAP: Record<string, string> = {
  NUR: "Nursery",
  LKG: "LKG",
  UKG: "UKG",
  "Class-I": "Class 1",
  "Class-II": "Class 2",
  "Class-III": "Class 3",
  "Class-IV": "Class 4",
  "Class-V": "Class 5",
  "Class-VI": "Class 6",
  "Class-VII": "Class 7",
  "Class-VIII": "Class 8",
  "Class-IX": "Class 9",
  "Class-X": "Class 10",
  "Class-XI": "Class 11",
  "Class-XII": "Class 12",
};

const NUR_TO_VIII = new Set([
  "NUR", "LKG", "UKG", "Class-I", "Class-II", "Class-III", "Class-IV",
  "Class-V", "Class-VI", "Class-VII", "Class-VIII",
]);
const IX_TO_X = new Set(["Class-IX", "Class-X"]);
const XI_TO_XII = new Set(["Class-XI", "Class-XII"]);

const BAD_ROW = /redact|promot|repeat|struck|obscur|unclear|verify|\btc\b/i;

function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s.toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
}

function toAmount(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v > 0 ? v : null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "" || t === "-") return null;
    const n = parseFloat(t.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (typeof v === "object" && v !== null && "result" in (v as any)) {
    return toAmount((v as any).result); // formula cell, e.g. Monthly Fee = Fee/12
  }
  return null;
}

function cellText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && v !== null && "text" in (v as any)) return (v as any).text;
  return String(v);
}

interface ErpStudent {
  studentId: string;
  name: string;
  normName: string;
  normFather: string;
}

// Levenshtein-based similarity in [0, 1]; 1 = identical.
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const m = a.length;
  const n = b.length;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  const dist = dp[n];
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// Same-class candidate lookup for names that don't match exactly. Deliberately
// conservative: a shared word alone (e.g. both starting with "Mohd") is NOT
// enough — that previously caused unrelated students sharing a common first
// name to be matched together, corrupting fee data (see git history). A match
// requires either a genuine subset/superset word overlap (covers nicknames,
// dropped middle names, "Mohd" vs "Mohammad" spelling), or — when that's not
// clean — BOTH the full name and the father's name independently clearing a
// similarity floor (a single strong signal alone isn't enough: a shared
// common surname like "Kumar"/"Khan" can inflate one score on its own).
// Among safe candidates, the best-scoring one wins rather than the first found.
function fuzzyFind(target: string, targetFather: string, pool: ErpStudent[], taken: Set<string>): ErpStudent | null {
  const targetWords = target.split(" ").filter(Boolean);
  if (targetWords.length === 0) return null;
  let best: ErpStudent | null = null;
  let bestScore = -1;
  for (const candidate of pool) {
    if (taken.has(candidate.studentId)) continue;
    const candWords = candidate.normName.split(" ").filter(Boolean);
    if (candWords.length === 0) continue;
    if (!targetWords.some((w) => candWords.includes(w))) continue;

    const subset = targetWords.every((w) => candWords.includes(w)) || candWords.every((w) => targetWords.includes(w));
    const nameSim = similarity(target, candidate.normName);
    const fatherSim = targetFather && candidate.normFather ? similarity(targetFather, candidate.normFather) : 0;
    if (!subset && !(nameSim >= 0.55 && fatherSim >= 0.5)) continue;

    const score = (subset ? 1 : 0) + nameSim + fatherSim * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const fileIdx = process.argv.indexOf("--file");
  const filePath = fileIdx >= 0 ? process.argv[fileIdx + 1] : "/home/abhinav/Desktop/School Fee Register Master (1).xlsx";

  const feeTypes = await db.feeType.findMany({ where: { schoolId: HCS_SCHOOL_ID } });
  const feeTypeByName = new Map(feeTypes.map((ft) => [ft.name, ft]));
  const required = ["TUTION FEES", "ANNUAL CHARGES", "MAFF", "Book", "Bus", "Practical", "Practical (11-12)", "Registration Board"];
  for (const name of required) {
    if (!feeTypeByName.has(name)) throw new Error(`Missing FeeType "${name}" for Howard Convent School — run the fee-type setup step first.`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const unmatchedRows: Record<string, string>[] = [];
  let totalValid = 0;
  let totalMatched = 0;
  let totalUpserts = 0;

  for (const [sheetName, erpClassName] of Object.entries(CLASS_SHEET_MAP)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" not found, skipping.`);
      continue;
    }

    const erpClass = await db.class.findFirst({ where: { schoolId: HCS_SCHOOL_ID, name: erpClassName } });
    if (!erpClass) {
      console.warn(`ERP class "${erpClassName}" not found, skipping sheet ${sheetName}.`);
      continue;
    }

    const enrollments = await db.classEnrollment.findMany({
      where: { schoolId: HCS_SCHOOL_ID, classId: erpClass.id, status: "ACTIVE" },
      include: { student: { include: { user: { select: { name: true } } } } },
    });
    const pool: ErpStudent[] = enrollments.map((e) => ({
      studentId: e.studentId,
      name: e.student.user.name,
      normName: norm(e.student.user.name),
      normFather: norm(e.student.fatherName),
    }));
    const taken = new Set<string>();

    const isNurToViii = NUR_TO_VIII.has(sheetName);
    const isIxToX = IX_TO_X.has(sheetName);
    const isXiToXii = XI_TO_XII.has(sheetName);
    const praFeeType = isXiToXii ? feeTypeByName.get("Practical (11-12)")! : feeTypeByName.get("Practical")!;

    let classMatched = 0;
    let classTotal = 0;

    // Column layout differs: NUR-VIII has Bus (10 cols total), IX-XII doesn't (9 cols
    // total), which shifts Remark/Monthly Fee left by one.
    // NUR-VIII: 1=S.N. 2=Name 3=Father 4=Annual 5=Fee 6=MAFF 7=Book 8=Bus 9=Remark 10=MonthlyFee
    // IX-XII:   1=S.N. 2=Name 3=Father 4=Annual 5=Fee 6=PRA  7=REG        8=Remark 9=MonthlyFee
    const remarkCol = isNurToViii ? 9 : 8;
    const monthlyFeeCol = isNurToViii ? 10 : 9;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // header rows (title row + column header row)
      const name = cellText(row.getCell(2).value);
      const father = cellText(row.getCell(3).value);
      const remark = cellText(row.getCell(remarkCol).value);

      if (!name || !name.trim()) return;
      if (BAD_ROW.test(name) || (remark && BAD_ROW.test(remark))) return;
      if (name.trim().toUpperCase() === "TOTAL") return;

      classTotal++;
      totalValid++;

      const normedName = norm(name);
      const normedFather = norm(father);
      let matchedStudent: ErpStudent | null = pool.find((p) => !taken.has(p.studentId) && p.normName === normedName) ?? null;
      if (!matchedStudent) {
        matchedStudent = fuzzyFind(normedName, normedFather, pool, taken);
      }

      const annual = toAmount(row.getCell(4).value);
      const monthlyFee = toAmount(row.getCell(monthlyFeeCol).value);
      const col6 = toAmount(row.getCell(6).value); // MAFF (NUR-VIII) or PRA (IX-XII)
      const col7 = toAmount(row.getCell(7).value); // Book (NUR-VIII) or REG (IX-XII)
      const col8 = isNurToViii ? toAmount(row.getCell(8).value) : null; // Bus (NUR-VIII only)

      const amounts: { feeTypeId: string; amount: number }[] = [];
      if (annual !== null) amounts.push({ feeTypeId: feeTypeByName.get("ANNUAL CHARGES")!.id, amount: annual });
      if (monthlyFee !== null) amounts.push({ feeTypeId: feeTypeByName.get("TUTION FEES")!.id, amount: monthlyFee });

      if (isNurToViii) {
        if (col6 !== null) amounts.push({ feeTypeId: feeTypeByName.get("MAFF")!.id, amount: col6 });
        if (col7 !== null) amounts.push({ feeTypeId: feeTypeByName.get("Book")!.id, amount: col7 });
        if (col8 !== null) amounts.push({ feeTypeId: feeTypeByName.get("Bus")!.id, amount: col8 });
      } else {
        if (col6 !== null) amounts.push({ feeTypeId: praFeeType.id, amount: col6 });
        if (col7 !== null) amounts.push({ feeTypeId: feeTypeByName.get("Registration Board")!.id, amount: col7 });
      }

      if (!matchedStudent) {
        unmatchedRows.push({
          sheet: sheetName,
          class: erpClassName,
          name,
          father: father ?? "",
          annual: String(annual ?? ""),
          monthlyFee: String(monthlyFee ?? ""),
          col6: String(col6 ?? ""),
          col7: String(col7 ?? ""),
          col8: String(col8 ?? ""),
        });
        return;
      }

      taken.add(matchedStudent.studentId);
      classMatched++;
      totalMatched++;
      totalUpserts += amounts.length;

      if (apply) {
        for (const { feeTypeId, amount } of amounts) {
          upsertQueue.push({ feeTypeId, studentId: matchedStudent!.studentId, amount });
        }
      }
    });

    console.log(`${sheetName.padEnd(12)} valid=${classTotal.toString().padStart(4)} matched=${classMatched.toString().padStart(4)} unmatched=${(classTotal - classMatched).toString().padStart(4)}`);
  }

  console.log(`\nTOTAL valid=${totalValid} matched=${totalMatched} unmatched=${totalValid - totalMatched} (planned upserts=${totalUpserts})`);

  const backupDir = path.join(__dirname, "..", "backups");
  const csvPath = path.join(backupDir, "hcs-fee-import-unmatched.csv");
  const header = "sheet,class,name,father,annual,monthlyFee,col6(MAFF/PRA),col7(Book/REG),col8(Bus)\n";
  const csvBody = unmatchedRows
    .map((r) => [r.sheet, r.class, r.name, r.father, r.annual, r.monthlyFee, r.col6, r.col7, r.col8].map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  fs.writeFileSync(csvPath, header + csvBody + "\n");
  console.log(`Unmatched rows written to ${csvPath}`);

  if (!apply) {
    console.log("Dry run only (no --apply flag) — no FeeTypeStudentAmount rows written.");
    return;
  }

  console.log(`Applying ${upsertQueue.length} upserts...`);
  const CHUNK_SIZE = 5; // matches the DB connection pool limit (connection_limit=5)
  for (let i = 0; i < upsertQueue.length; i += CHUNK_SIZE) {
    const chunk = upsertQueue.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((u) =>
        db.feeTypeStudentAmount.upsert({
          where: { feeTypeId_studentId: { feeTypeId: u.feeTypeId, studentId: u.studentId } },
          update: { amount: u.amount },
          create: { feeTypeId: u.feeTypeId, studentId: u.studentId, amount: u.amount, schoolId: HCS_SCHOOL_ID },
        })
      )
    );
    console.log(`  ${Math.min(i + CHUNK_SIZE, upsertQueue.length)}/${upsertQueue.length}`);
  }
  console.log("Done.");
}

const upsertQueue: { feeTypeId: string; studentId: string; amount: number }[] = [];

main().catch(console.error).finally(() => db.$disconnect());
