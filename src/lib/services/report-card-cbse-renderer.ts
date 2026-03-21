/**
 * CBSE Annual Report Card PDF Renderer
 *
 * Layout matches the ClassON-style CBSE annual report card design:
 *   - Decorative red border
 *   - School header: logo | school name + address + helpline | emblem
 *   - "Annual Term (Session YYYY-YYYY)" title bar
 *   - Student info grid with photo placeholder (right)
 *   - Scholastic subjects table:
 *       Term-1 cols: Periodic Test(10), Multiple Assessment(5), Portfolio(5), Half Yearly(80), Total(100)
 *       Term-2 cols: same
 *       Overall: Marks Obtained, Grade
 *   - Summary bar: Attendance | Total Marks | Percentage | Grade
 *   - Co-scholastic split table (left: subjects, right: activities) with Term1/Term2 grades
 *   - Grade scale table
 *   - Remarks + Promotion line
 *   - Three signature lines
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import fs from "fs";
import path from "path";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  MultiTermReportCardData,
  TermSubjectResult,
  StudentInfoExtended,
  TermSlice,
  CBSEGradeEntry,
} from "./report-card-data-aggregation";
import { getCBSEGradeScale } from "./report-card-data-aggregation";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const PAGE = { width: 210, height: 297 } as const;
const MARGIN = { left: 12, right: 12, top: 12, bottom: 12 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const C = {
  red:        "#C0392B",   // used only for school name text & helpline
  black:      "#1a1a1a",
  white:      "#FFFFFF",
  grey:       "#6b7280",
  greyLight:  "#f0f0f0",
  border:     "#999999",   // neutral grid lines
  altRow:     "#f9f9f9",
  pass:       "#16a34a",
  fail:       "#dc2626",
  compartment:"#d97706",
} as const;

// Cached border image base64
let _borderImageCache: string | null = null;
function getBorderImageBase64(): string | null {
  if (_borderImageCache !== null) return _borderImageCache;
  try {
    const imgPath = path.join(process.cwd(), "public", "border.png");
    const data = fs.readFileSync(imgPath);
    _borderImageCache = `data:image/png;base64,${data.toString("base64")}`;
    return _borderImageCache;
  } catch {
    _borderImageCache = "";
    return null;
  }
}

// Cached Sikshamitra logo (public/logo.png) used as emblem fallback
let _sikshamitraLogoCache: string | null = null;
function getSikshamitraLogoBase64(): string | null {
  if (_sikshamitraLogoCache !== null) return _sikshamitraLogoCache;
  try {
    const imgPath = path.join(process.cwd(), "public", "logo.png");
    const data = fs.readFileSync(imgPath);
    _sikshamitraLogoCache = `data:image/png;base64,${data.toString("base64")}`;
    return _sikshamitraLogoCache;
  } catch {
    _sikshamitraLogoCache = "";
    return null;
  }
}

/** Fetch a remote image URL and return a base64 data URI, or null on failure */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "image/jpeg";
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Detect jsPDF image format string from a data URI or URL */
function detectImageFormat(src: string): "PNG" | "JPEG" | "WEBP" {
  if (src.startsWith("data:image/png") || /\.png(\?|$)/i.test(src)) return "PNG";
  if (src.startsWith("data:image/webp") || /\.webp(\?|$)/i.test(src)) return "WEBP";
  return "JPEG";
}

/** Safe addImage wrapper — swallows errors so a bad image never crashes the PDF */
function safeAddImage(
  doc: jsPDF,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  try {
    doc.addImage(src, detectImageFormat(src), x, y, w, h);
  } catch { /* skip */ }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateCBSEReportCardPDF(
  data: MultiTermReportCardData,
  options: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolWebsite?: string;
    schoolLogo?: string;
    schoolEmblem?: string;
    affiliationNo?: string;
    schoolCode?: string;
    cbseLevel?: "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR";
  } = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const gradeScale = await getCBSEGradeScale(data.student.schoolId);

  const level = options.cbseLevel ?? detectCBSELevel(data.student.class);

  if (level === "CBSE_SECONDARY") {
    await renderSecondaryPage(doc, data, options, gradeScale);
  } else if (level === "CBSE_SENIOR") {
    await renderSeniorPage(doc, data, options, gradeScale);
  } else {
    await renderPage(doc, data, options, gradeScale);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateBatchCBSEReportCards(
  dataList: MultiTermReportCardData[],
  options: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolWebsite?: string;
    schoolLogo?: string;
    schoolEmblem?: string;
    affiliationNo?: string;
    schoolCode?: string;
    cbseLevel?: "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR";
  } = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let gradeScaleCache: CBSEGradeEntry[] | null = null;

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];
    if (!gradeScaleCache) {
      gradeScaleCache = await getCBSEGradeScale(data.student.schoolId);
    }
    if (i > 0) doc.addPage();

    const level = options.cbseLevel ?? detectCBSELevel(data.student.class);
    if (level === "CBSE_SECONDARY") {
      await renderSecondaryPage(doc, data, options, gradeScaleCache);
    } else if (level === "CBSE_SENIOR") {
      await renderSeniorPage(doc, data, options, gradeScaleCache);
    } else {
      await renderPage(doc, data, options, gradeScaleCache);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/** Detect CBSE level from class name (e.g. "Class 9", "XI", "12") */
function detectCBSELevel(className: string): "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR" {
  const match = className.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 11) return "CBSE_SENIOR";
    if (num >= 9) return "CBSE_SECONDARY";
  }
  // Roman numerals
  const upper = className.toUpperCase();
  if (upper.includes("XI") || upper.includes("XII") || upper.includes("11") || upper.includes("12")) return "CBSE_SENIOR";
  if (upper.includes("IX") || upper.includes("X") || upper.includes("9") || upper.includes("10")) return "CBSE_SECONDARY";
  return "CBSE_PRIMARY";
}

// ---------------------------------------------------------------------------
// Page renderer
// ---------------------------------------------------------------------------

async function renderPage(
  doc: jsPDF,
  data: MultiTermReportCardData,
  opts: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolWebsite?: string;
    schoolLogo?: string;
    schoolEmblem?: string;
    affiliationNo?: string;
    schoolCode?: string;
  },
  gradeScale: CBSEGradeEntry[],
): Promise<void> {
  // Resolve student avatar to base64 if it's a remote URL
  let studentAvatar = data.student.avatar ?? undefined;
  if (studentAvatar && studentAvatar.startsWith("http")) {
    studentAvatar = (await fetchImageAsBase64(studentAvatar)) ?? undefined;
  }

  // Resolve school logo to base64 if it's a remote URL
  let schoolLogo = opts.schoolLogo;
  if (schoolLogo && schoolLogo.startsWith("http")) {
    schoolLogo = (await fetchImageAsBase64(schoolLogo)) ?? undefined;
  }

  // Emblem: use passed value, else fall back to Sikshamitra logo
  const schoolEmblem = opts.schoolEmblem ?? getSikshamitraLogoBase64() ?? undefined;

  renderDecorativeBorder(doc);

  const resolvedOpts = { ...opts, schoolLogo, schoolEmblem };
  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, resolvedOpts, y);
  y = renderStudentInfo(doc, data.student, studentAvatar, y);
  y = renderScholasticTable(doc, data, gradeScale, y);
  y = renderSummaryBar(doc, data, y);
  y = renderCoScholasticSection(doc, data, y);
  y = renderGradeScaleTable(doc, gradeScale, y);
  y = renderRemarks(doc, data, y);
  renderSignatures(doc, y);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function hex(color: string): [number, number, number] {
  const h = color.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.height - MARGIN.bottom - 20) {
    doc.addPage();
    renderDecorativeBorder(doc);
    return MARGIN.top + 4;
  }
  return y;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ---------------------------------------------------------------------------
// 0. Border — uses public/border.png as a full-page overlay
// ---------------------------------------------------------------------------

function renderDecorativeBorder(doc: jsPDF): void {
  const borderB64 = getBorderImageBase64();
  if (borderB64) {
    try {
      doc.addImage(borderB64, "PNG", 0, 0, PAGE.width, PAGE.height);
    } catch { /* skip if image fails */ }
  }
}

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------

function renderHeader(
  doc: jsPDF,
  data: MultiTermReportCardData,
  opts: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolWebsite?: string;
    schoolLogo?: string;
    schoolEmblem?: string;
  },
  startY: number,
): number {
  let y = startY;
  const logoW = 22;
  const logoH = 22;
  const emblemW = 32;   // wider to fit Sikshamitra landscape logo
  const textX = MARGIN.left + logoW + 3;
  const textW = CONTENT_WIDTH - logoW - emblemW - 6;
  const centerX = textX + textW / 2;

  // School logo (left)
  if (opts.schoolLogo) {
    safeAddImage(doc, opts.schoolLogo, MARGIN.left, y, logoW, logoH);
  } else {
    // Placeholder circle
    doc.setDrawColor(...hex(C.red));
    doc.setLineWidth(0.5);
    doc.circle(MARGIN.left + logoW / 2, y + logoH / 2, logoW / 2 - 1);
    doc.setFontSize(6);
    doc.setTextColor(...hex(C.red));
    doc.text("LOGO", MARGIN.left + logoW / 2, y + logoH / 2 + 1, { align: "center" });
  }

  // School emblem (right) — Sikshamitra logo with white background
  const emblemX = PAGE.width - MARGIN.right - emblemW;
  if (opts.schoolEmblem) {
    // White background so the logo is readable against the border image
    doc.setFillColor(255, 255, 255);
    doc.rect(emblemX, y, emblemW, logoH, "F");
    // Render logo slightly inset so it doesn't bleed to the edges
    safeAddImage(doc, opts.schoolEmblem, emblemX + 1, y + 1, emblemW - 2, logoH - 2);
  }

  // School name  — large, bold, red (matches image)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.red));
  doc.text(opts.schoolName || "School Name", centerX, y + 7, { align: "center" });

  // Thin red underline beneath school name
  const nameW = doc.getTextWidth(opts.schoolName || "School Name");
  doc.setDrawColor(...hex(C.red));
  doc.setLineWidth(0.4);
  doc.line(centerX - nameW / 2, y + 8.5, centerX + nameW / 2, y + 8.5);

  // Address — small, black
  if (opts.schoolAddress) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(C.black));
    doc.text(opts.schoolAddress, centerX, y + 12.5, { align: "center" });
  }

  // Helpline / phone — bold, magenta-red (matches image colour)
  if (opts.schoolPhone) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(192, 0, 128);   // magenta-red as in image
    doc.text(`Helpline  ${opts.schoolPhone}`, centerX, y + 17.5, { align: "center" });
  }

  // Email + website — small, black
  const contactParts: string[] = [];
  if (opts.schoolEmail) contactParts.push(`Email : ${opts.schoolEmail}`);
  if (opts.schoolWebsite) contactParts.push(`Website : ${opts.schoolWebsite}`);
  if (contactParts.length > 0) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(C.black));
    doc.text(contactParts.join("    "), centerX, y + 22, { align: "center" });
  }

  y += logoH + 3;

  // ── "Annual Term (Session ...)" title bar — gray bg, all four borders ──
  const barH = 8;
  doc.setFillColor(240, 240, 240);   // light gray background
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, barH, "FD");

  doc.setTextColor(...hex(C.black));
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Annual Term (Session ${data.academicYear})`,
    PAGE.width / 2,
    y + 5.5,
    { align: "center" },
  );

  y += barH + 2;

  return y;
}

// ---------------------------------------------------------------------------
// 2. Student Info
// ---------------------------------------------------------------------------

function renderStudentInfo(
  doc: jsPDF,
  student: StudentInfoExtended,
  avatar: string | undefined,
  startY: number,
): number {
  const y = startY;
  const photoW = 26;
  const photoH = 32;
  const photoX = PAGE.width - MARGIN.right - photoW - 1;
  const infoW = CONTENT_WIDTH - photoW - 5;

  // Outer border around entire student info block — neutral
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, photoH + 3);

  // Photo box
  doc.setDrawColor(...hex(C.grey));
  doc.setLineWidth(0.3);
  doc.rect(photoX, y + 1, photoW, photoH);
  if (avatar) {
    safeAddImage(doc, avatar, photoX + 0.5, y + 1.5, photoW - 1, photoH - 1);
  } else {
    doc.setFontSize(6);
    doc.setTextColor(...hex(C.grey));
    doc.text("Photo", photoX + photoW / 2, y + photoH / 2 + 1, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(...hex(C.black));

  const col1X = MARGIN.left + 2;
  const col2X = MARGIN.left + infoW / 2 + 2;
  const rowH = 5.2;
  let iy = y + 5.5;

  const fatherName = student.parent?.fatherName || "-";
  const motherName = student.parent?.motherName || "-";

  const rows: [string, string, string, string][] = [
    ["Student's Name", student.name,          "Class",        student.class],
    ["Father's Name",  fatherName,             "Section",      student.section],
    ["Mother's Name",  motherName,             "Roll No",      student.rollNumber || "-"],
    ["D.O.B.",         formatDate(student.dateOfBirth), "Admission No.", student.admissionId],
    ["Height",         student.height ? `${student.height} CM` : "-", "Weight", student.weight ? `${student.weight} KG` : "-"],
  ];

  for (const [l1, v1, l2, v2] of rows) {
    infoCell(doc, l1, v1, col1X, iy);
    infoCell(doc, l2, v2, col2X, iy);
    iy += rowH;
  }

  return y + photoH + 5;
}

function infoCell(doc: jsPDF, label: string, value: string, x: number, y: number): void {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.black));
  doc.text(`${label} : `, x, y);
  const lw = doc.getTextWidth(`${label} : `);
  doc.setFont("helvetica", "normal");
  doc.text(value, x + lw, y);
}

// ---------------------------------------------------------------------------
// 3. Scholastic Subjects Table
// ---------------------------------------------------------------------------
// Columns per the design:
//   Subject | T1: PT(10) MA(5) Port(5) HY(80) Total(100) | T2: same | Overall: Marks Grade

function renderScholasticTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  _gradeScale: CBSEGradeEntry[],
  startY: number,
): number {
  let y = startY;

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;
  const t1Label = term1?.term.name || "Term 1";
  const t2Label = term2?.term.name || "Term 2";

  // Header: row 0 = full-width section title, row 1 = term groups, row 2 = sub-columns
  const head: any[][] = [
    [
      {
        content: "Scholastic Subjects",
        colSpan: 13,
        styles: { halign: "left" as const, fontStyle: "bold" as const, fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
      },
    ],
    [
      { content: "Subjects", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold" } },
      { content: t1Label, colSpan: 5, styles: { halign: "center", fontStyle: "bold" } },
      { content: t2Label, colSpan: 5, styles: { halign: "center", fontStyle: "bold" } },
      { content: "Overall", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
    ],
    [
      { content: "Periodic\nTest\n(10)",          styles: { halign: "center", fontSize: 6 } },
      { content: "Multiple\nAssessment\n(5)",      styles: { halign: "center", fontSize: 6 } },
      { content: "Portfolio\n(5)",                 styles: { halign: "center", fontSize: 6 } },
      { content: "Half\nYearly\n(80)",             styles: { halign: "center", fontSize: 6 } },
      { content: "Total\n(100)",                   styles: { halign: "center", fontSize: 6 } },
      { content: "Periodic\nTest\n(10)",           styles: { halign: "center", fontSize: 6 } },
      { content: "Multiple\nAssessment\n(5)",      styles: { halign: "center", fontSize: 6 } },
      { content: "Portfolio\n(5)",                 styles: { halign: "center", fontSize: 6 } },
      { content: "Final\n(80)",                    styles: { halign: "center", fontSize: 6 } },
      { content: "Total\n(100)",                   styles: { halign: "center", fontSize: 6 } },
      { content: "Marks\nObtained",                styles: { halign: "center", fontSize: 6 } },
      { content: "Grade",                          styles: { halign: "center", fontSize: 6 } },
    ],
  ];

  const subjects = data.annualSubjects;
  const body = subjects.map((subj) => {
    const t1s = findTermSubject(term1, subj.subjectId);
    const t2s = term2 ? findTermSubject(term2, subj.subjectId) : null;

    const t1pt   = getComponentByName(t1s, "PT", "PERIODIC TEST", "PERIODIC_TEST");
    const t1ma   = getComponentByName(t1s, "MA", "MULTIPLE ASSESSMENT", "MULTIPLE_ASSESSMENT");
    const t1port = getComponentByName(t1s, "PORTFOLIO");
    const t1hy   = getComponentByName(t1s, "HALF_YEARLY", "HALF YEARLY", "HY");
    const t1tot  = t1s && !t1s.isAbsent ? `${t1s.totalMarks}` : (t1s?.isAbsent ? "AB" : "-");

    const t2pt   = getComponentByName(t2s, "PT", "PERIODIC TEST", "PERIODIC_TEST");
    const t2ma   = getComponentByName(t2s, "MA", "MULTIPLE ASSESSMENT", "MULTIPLE_ASSESSMENT");
    const t2port = getComponentByName(t2s, "PORTFOLIO");
    const t2hy   = getComponentByName(t2s, "ANNUAL", "FINAL", "HALF_YEARLY", "HY");
    const t2tot  = t2s && !t2s.isAbsent ? `${t2s.totalMarks}` : (t2s?.isAbsent ? "AB" : "-");

    const overall = subj.isAbsent ? "AB" : `${subj.totalMarks}`;
    const grade   = subj.grade || "-";

    return [subj.subjectName || subj.subjectCode || "Subject", t1pt, t1ma, t1port, t1hy, t1tot, t2pt, t2ma, t2port, t2hy, t2tot, overall, grade];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(C.white),
      textColor: hex(C.black),
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
      cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
    },
    bodyStyles: {
      fontSize: 7,
      textColor: hex(C.black),
      halign: "center",
      cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 26, fontStyle: "normal" },
    },
    alternateRowStyles: { fillColor: hex(C.altRow) },
    styles: {
      lineColor: hex(C.border),
      lineWidth: 0.2,
    },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 2;
}

function getComponentByName(subj: TermSubjectResult | null, ...names: string[]): string {
  if (!subj || subj.isAbsent) return subj?.isAbsent ? "AB" : "-";
  const comp = subj.components?.find((c) =>
    names.some((n) => c.shortName?.toUpperCase() === n || c.componentName?.toUpperCase() === n)
  );
  if (!comp) {
    // Fallback to index if no named component found
    const idx = names.includes("PT") ? 0 : names.includes("MA") ? 1 : names.includes("PORTFOLIO") ? 2 : 3;
    const fallback = subj.components?.[idx];
    if (!fallback) return "-";
    return fallback.isAbsent ? "AB" : `${fallback.obtainedMarks}`;
  }
  return comp.isAbsent ? "AB" : `${comp.obtainedMarks}`;
}

function findTermSubject(
  termSlice: TermSlice | null | undefined,
  subjectId: string,
): TermSubjectResult | null {
  if (!termSlice) return null;
  return termSlice.subjects.find((s) => s.subjectId === subjectId) ?? null;
}

// ---------------------------------------------------------------------------
// 4. Summary bar: Attendance | Total Marks | Percentage | Grade
// ---------------------------------------------------------------------------

function renderSummaryBar(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  const y = startY;
  const rowH = 7; // single row height
  const perf = data.overallPerformance;

  const totalDays    = data.terms.reduce((s, t) => s + t.attendance.totalDays, 0);
  const totalPresent = data.terms.reduce((s, t) => s + t.attendance.daysPresent, 0);

  const cells = [
    { label: "Attendance",   value: `${totalPresent}/${totalDays}` },
    { label: "Total Marks",  value: `${perf.obtainedMarks}/${perf.maxMarks}` },
    { label: "Percentage",   value: `${perf.percentage.toFixed(2)} %` },
    { label: "Grade",        value: perf.grade || "-" },
  ];

  const gap     = 2;  // mm gap between cells
  const cellW   = (CONTENT_WIDTH - gap * (cells.length - 1)) / cells.length;
  const labelW  = cellW * 0.45; // label takes 45% of cell width
  const valueW  = cellW - labelW;

  doc.setLineWidth(0.3);
  doc.setDrawColor(...hex(C.border));

  cells.forEach((cell, i) => {
    const cx = MARGIN.left + i * (cellW + gap);

    // Cell background
    doc.setFillColor(...hex(C.greyLight));
    doc.rect(cx, y, cellW, rowH, "FD");

    // Divider between label and value sub-columns
    doc.setDrawColor(...hex(C.border));
    doc.setLineWidth(0.2);
    doc.line(cx + labelW, y, cx + labelW, y + rowH);

    // Label (left side) — bold, small
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hex(C.black));
    doc.text(cell.label, cx + labelW / 2, y + rowH / 2 + 1.2, { align: "center" });

    // Value (right side) — bold, slightly larger
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hex(C.black));
    doc.text(cell.value, cx + labelW + valueW / 2, y + rowH / 2 + 1.2, { align: "center" });
  });

  return y + rowH + 3;
}

// ---------------------------------------------------------------------------
// 5. Co-scholastic section (split two-column layout)
// ---------------------------------------------------------------------------

function renderCoScholasticSection(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = checkPageBreak(doc, startY, 40);

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;
  const t1Label = term1?.term.name || "Term 1";
  const t2Label = term2?.term.name || "Term 2";

  // Collect all co-scholastic activities
  const activityMap = new Map<string, { name: string; t1: string; t2: string; isSkill: boolean }>();

  if (term1) {
    for (const cs of term1.coScholastic) {
      activityMap.set(cs.activityId, {
        name: cs.activityName,
        t1: cs.grade || "-",
        t2: "-",
        isSkill: cs.category === "SKILL_ACTIVITY",
      });
    }
  }
  if (term2) {
    for (const cs of term2.coScholastic) {
      const ex = activityMap.get(cs.activityId);
      if (ex) {
        ex.t2 = cs.grade || "-";
      } else {
        activityMap.set(cs.activityId, {
          name: cs.activityName,
          t1: "-",
          t2: cs.grade || "-",
          isSkill: cs.category === "SKILL_ACTIVITY",
        });
      }
    }
  }

  const allActivities = Array.from(activityMap.values());
  const coScholastic = allActivities.filter((a) => !a.isSkill);
  const skillActivities = allActivities.filter((a) => a.isSkill);

  if (allActivities.length === 0) return y;

  const halfW = (CONTENT_WIDTH - 2) / 2;

  // Left table — section title as first header row
  const leftHead = [
    [{ content: "Co scholastic Subjects Area (on a 5 point grade scale)", colSpan: 3, styles: { halign: "left" as const, fontStyle: "bold" as const, fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } } }],
    ["SUBJECTS", t1Label, t2Label],
  ];
  const leftBody = coScholastic.length > 0
    ? coScholastic.map((a) => [a.name, a.t1, a.t2])
    : [["—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    head: leftHead,
    body: leftBody,
    theme: "grid",
    headStyles: { fillColor: hex(C.white), textColor: hex(C.black), fontStyle: "bold", fontSize: 7, cellPadding: 1.5 },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: halfW - 20, halign: "left" }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 10, halign: "center" } },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: MARGIN.left, right: PAGE.width - MARGIN.left - halfW },
  });

  const leftFinalY = (doc as any).lastAutoTable.finalY;

  // Right table — section title as first header row
  const rightX = MARGIN.left + halfW + 2;
  const rightHead = [
    [{ content: "Activities/Skill Subjects Areas (on a 3 point grade scale)", colSpan: 3, styles: { halign: "left" as const, fontStyle: "bold" as const, fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } } }],
    ["SUBJECTS", t1Label, t2Label],
  ];
  const rightBody = skillActivities.length > 0
    ? skillActivities.map((a) => [a.name, a.t1, a.t2])
    : [["—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    head: rightHead,
    body: rightBody,
    theme: "grid",
    headStyles: { fillColor: hex(C.white), textColor: hex(C.black), fontStyle: "bold", fontSize: 7, cellPadding: 1.5 },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: halfW - 20, halign: "left" }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 10, halign: "center" } },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: rightX, right: MARGIN.right },
  });

  const rightFinalY = (doc as any).lastAutoTable.finalY;

  return Math.max(leftFinalY, rightFinalY) + 3;
}

// ---------------------------------------------------------------------------
// 6. Grade Scale Table
// ---------------------------------------------------------------------------

function renderGradeScaleTable(
  doc: jsPDF,
  gradeScale: CBSEGradeEntry[],
  startY: number,
): number {
  let y = checkPageBreak(doc, startY, 22);

  const colCount = gradeScale.length + 1; // label col + one per grade entry
  const head = [
    [{ content: "Grade Scale For Scholastic Areas (Grades are awarded on 8 Point Grade Scale As Follows) :", colSpan: colCount, styles: { halign: "left" as const, fontStyle: "bold" as const, fontSize: 7.5, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } } }],
    ["Marks Range (%)", ...gradeScale.map((g) => `${g.minMarks}-${g.maxMarks}`)],
  ];
  const body = [["Grade", ...gradeScale.map((g) => g.grade)]];

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(C.white),
      textColor: hex(C.black),
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: 1.5,
      halign: "center",
      lineColor: hex(C.border),
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: hex(C.black),
      halign: "center",
      cellPadding: 1.5,
    },
    columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 3;
}

// ---------------------------------------------------------------------------
// 7. Remarks + Promotion
// ---------------------------------------------------------------------------

function renderRemarks(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = checkPageBreak(doc, startY, 22);

  // Plain remarks box — no fill, neutral border
  const boxH = 16;
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, boxH, "D");

  doc.setFontSize(8);
  doc.setTextColor(...hex(C.black));
  let ry = y + 5;

  if (data.remarks.teacherRemarks) {
    doc.setFont("helvetica", "bold");
    doc.text("Remarks: ", MARGIN.left + 2, ry);
    const lw = doc.getTextWidth("Remarks: ");
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.teacherRemarks, CONTENT_WIDTH - lw - 4);
    doc.text(lines, MARGIN.left + 2 + lw, ry);
    ry += Math.max(lines.length * 4.5, 5) + 1;
  }

  if (data.remarks.principalRemarks) {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.principalRemarks, CONTENT_WIDTH - 4);
    doc.text(lines, MARGIN.left + 2, ry);
    ry += Math.max(lines.length * 4.5, 5) + 1;
  }

  y += boxH + 2;

  // Promotion line — with top padding
  const status = data.resultStatus;
  if (status === "PASS") {
    const nextClass = getNextClass(data.student.class);
    y += 4;   // top padding
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hex(C.black));
    doc.text(`Congratulations! You are promoted to ${nextClass}`, MARGIN.left, y);
    y += 6;
  }

  return y + 2;
}

function getNextClass(currentClass: string): string {
  const match = currentClass.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return currentClass.replace(/\d+/, String(num + 1));
  }
  return currentClass;
}

// ---------------------------------------------------------------------------
// 8. Signatures
// ---------------------------------------------------------------------------

function renderSignatures(doc: jsPDF, startY: number): void {
  // Always pin signatures near the bottom of the page
  const y = Math.max(startY + 8, PAGE.height - 26);

  const positions = [
    { x: PAGE.width / 3,       label: "Class Teacher" },
    { x: PAGE.width * 2 / 3,   label: "Principal Signature" },
  ];

  for (const pos of positions) {
    // White background behind signature area (covers border.png)
    doc.setFillColor(255, 255, 255);
    doc.rect(pos.x - 24, y - 16, 48, 24, "F");

    // Signature line
    doc.setDrawColor(...hex(C.black));
    doc.setLineWidth(0.4);
    doc.line(pos.x - 20, y, pos.x + 20, y);

    // Label below line
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(C.black));
    doc.text(pos.label, pos.x, y + 5, { align: "center" });
  }
}

// (emblemH removed — logoH is used directly in renderHeader)

// ---------------------------------------------------------------------------
// CBSE Secondary (Class 9–10) renderer
// Layout: Subject | Theory(80/70) | Practical/Internal(20/30) | Total(100) | Grade
// Single annual exam, pass mark 33%
// ---------------------------------------------------------------------------

async function renderSecondaryPage(
  doc: jsPDF,
  data: MultiTermReportCardData,
  opts: Parameters<typeof renderPage>[2],
  gradeScale: CBSEGradeEntry[],
): Promise<void> {
  let studentAvatar = data.student.avatar ?? undefined;
  if (studentAvatar && studentAvatar.startsWith("http")) {
    studentAvatar = (await fetchImageAsBase64(studentAvatar)) ?? undefined;
  }
  let schoolLogo = opts.schoolLogo;
  if (schoolLogo && schoolLogo.startsWith("http")) {
    schoolLogo = (await fetchImageAsBase64(schoolLogo)) ?? undefined;
  }
  const schoolEmblem = opts.schoolEmblem ?? getSikshamitraLogoBase64() ?? undefined;
  const resolvedOpts = { ...opts, schoolLogo, schoolEmblem };

  renderDecorativeBorder(doc);
  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, resolvedOpts, y);
  y = renderStudentInfo(doc, data.student, studentAvatar, y);
  y = renderSecondaryScholasticTable(doc, data, y);
  y = renderSummaryBar(doc, data, y);
  y = renderCoScholasticSection(doc, data, y);
  y = renderGradeScaleTable(doc, gradeScale, y);
  y = renderRemarks(doc, data, y);
  renderSignatures(doc, y);
}

function renderSecondaryScholasticTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.black));
  doc.text("Scholastic Subjects (Class 9–10)", MARGIN.left, startY + 4.2);
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, startY + 6, MARGIN.left + CONTENT_WIDTH, startY + 6);
  const y = startY + 8;

  const head: any[][] = [[
    { content: "Subjects", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Theory", styles: { halign: "center" } },
    { content: "Practical / Internal", styles: { halign: "center" } },
    { content: "Total (100)", styles: { halign: "center" } },
    { content: "Grade", styles: { halign: "center" } },
    { content: "Pass / Fail", styles: { halign: "center" } },
  ]];

  const subjects = data.annualSubjects;
  const body = subjects.map((subj) => {
    const theory = subj.theoryMarks != null ? `${subj.theoryMarks}` : (subj.isAbsent ? "AB" : "-");
    const practical = subj.practicalMarks != null ? `${subj.practicalMarks}` : (subj.internalMarks != null ? `${subj.internalMarks}` : "-");
    const total = subj.isAbsent ? "AB" : `${subj.totalMarks}`;
    const grade = subj.grade || "-";
    const status = subj.isAbsent ? "AB" : (subj.percentage >= 33 ? "Pass" : "Fail");
    return [subj.subjectName || subj.subjectCode || "Subject", theory, practical, total, grade, status];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: hex(C.white), textColor: hex(C.black), fontStyle: "bold", halign: "center", fontSize: 7, cellPadding: 1.5 },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), halign: "center", cellPadding: 1.5 },
    columnStyles: { 0: { halign: "left", cellWidth: 40 } },
    alternateRowStyles: { fillColor: hex(C.altRow) },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: MARGIN.left, right: MARGIN.right },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === "Fail") data.cell.styles.textColor = hex(C.fail);
        else if (val === "Pass") data.cell.styles.textColor = hex(C.pass);
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 2;
}

// ---------------------------------------------------------------------------
// CBSE Senior Secondary (Class 11–12) renderer
// Layout: Subject | Theory(70/80) | Practical/Internal(30/20) | Total(100) | Grade | Pass/Fail
// Single annual exam, no PT/MA/Portfolio breakdown
// ---------------------------------------------------------------------------

async function renderSeniorPage(
  doc: jsPDF,
  data: MultiTermReportCardData,
  opts: Parameters<typeof renderPage>[2],
  gradeScale: CBSEGradeEntry[],
): Promise<void> {
  let studentAvatar = data.student.avatar ?? undefined;
  if (studentAvatar && studentAvatar.startsWith("http")) {
    studentAvatar = (await fetchImageAsBase64(studentAvatar)) ?? undefined;
  }
  let schoolLogo = opts.schoolLogo;
  if (schoolLogo && schoolLogo.startsWith("http")) {
    schoolLogo = (await fetchImageAsBase64(schoolLogo)) ?? undefined;
  }
  const schoolEmblem = opts.schoolEmblem ?? getSikshamitraLogoBase64() ?? undefined;
  const resolvedOpts = { ...opts, schoolLogo, schoolEmblem };

  renderDecorativeBorder(doc);
  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, resolvedOpts, y);
  y = renderStudentInfo(doc, data.student, studentAvatar, y);
  y = renderSeniorScholasticTable(doc, data, y);
  y = renderSummaryBar(doc, data, y);
  y = renderGradeScaleTable(doc, gradeScale, y);
  y = renderRemarks(doc, data, y);
  renderSignatures(doc, y);
}

function renderSeniorScholasticTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.black));
  doc.text("Scholastic Subjects (Class 11–12)", MARGIN.left, startY + 4.2);
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, startY + 6, MARGIN.left + CONTENT_WIDTH, startY + 6);
  const y = startY + 8;

  const head: any[][] = [[
    { content: "Subjects", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Theory\n(70/80)", styles: { halign: "center" } },
    { content: "Practical /\nInternal\n(30/20)", styles: { halign: "center" } },
    { content: "Total\n(100)", styles: { halign: "center" } },
    { content: "Grade", styles: { halign: "center" } },
    { content: "Pass /\nFail", styles: { halign: "center" } },
  ]];

  const subjects = data.annualSubjects;
  const body = subjects.map((subj) => {
    const theory = subj.theoryMarks != null ? `${subj.theoryMarks}` : (subj.isAbsent ? "AB" : "-");
    const practical = subj.practicalMarks != null
      ? `${subj.practicalMarks}`
      : (subj.internalMarks != null ? `${subj.internalMarks}` : "-");
    const total = subj.isAbsent ? "AB" : `${subj.totalMarks}`;
    const grade = subj.grade || "-";
    // Senior secondary pass: 33% in theory AND 33% in practical separately
    const theoryPct = subj.theoryMaxMarks && subj.theoryMaxMarks > 0
      ? ((subj.theoryMarks ?? 0) / subj.theoryMaxMarks) * 100
      : subj.percentage;
    const practPct = subj.practicalMaxMarks && subj.practicalMaxMarks > 0
      ? ((subj.practicalMarks ?? 0) / subj.practicalMaxMarks) * 100
      : 100;
    const status = subj.isAbsent ? "AB" : (theoryPct >= 33 && practPct >= 33 ? "Pass" : "Fail");
    return [subj.subjectName || subj.subjectCode || "Subject", theory, practical, total, grade, status];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: hex(C.white), textColor: hex(C.black), fontStyle: "bold", halign: "center", fontSize: 7, cellPadding: 1.5 },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), halign: "center", cellPadding: 1.5 },
    columnStyles: { 0: { halign: "left", cellWidth: 45 } },
    alternateRowStyles: { fillColor: hex(C.altRow) },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: MARGIN.left, right: MARGIN.right },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === "Fail") data.cell.styles.textColor = hex(C.fail);
        else if (val === "Pass") data.cell.styles.textColor = hex(C.pass);
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 2;
}
