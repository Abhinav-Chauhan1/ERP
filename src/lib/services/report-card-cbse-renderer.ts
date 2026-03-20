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
const MARGIN = { left: 8, right: 8, top: 8, bottom: 8 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const C = {
  red:        "#C0392B",
  redLight:   "#E74C3C",
  redBg:      "#FDEDEC",
  navy:       "#1a3a6b",
  black:      "#1a1a1a",
  white:      "#FFFFFF",
  grey:       "#6b7280",
  greyLight:  "#f5f5f5",
  border:     "#C0392B",
  headerBg:   "#C0392B",
  sectionBg:  "#C0392B",
  altRow:     "#FEF9F9",
  pass:       "#16a34a",
  fail:       "#dc2626",
  compartment:"#d97706",
} as const;

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
  renderDecorativeBorder(doc);

  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, opts, y);
  y = renderStudentInfo(doc, data.student, y);
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
// 0. Decorative border
// ---------------------------------------------------------------------------

function renderDecorativeBorder(doc: jsPDF): void {
  // Outer red border
  doc.setDrawColor(...hex(C.red));
  doc.setLineWidth(1.5);
  doc.rect(4, 4, PAGE.width - 8, PAGE.height - 8);
  // Inner thin border
  doc.setLineWidth(0.4);
  doc.rect(5.5, 5.5, PAGE.width - 11, PAGE.height - 11);
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
  const emblemW = 22;
  const textX = MARGIN.left + logoW + 3;
  const textW = CONTENT_WIDTH - logoW - emblemW - 6;
  const centerX = textX + textW / 2;

  // School logo (left)
  if (opts.schoolLogo) {
    try {
      doc.addImage(opts.schoolLogo, "PNG", MARGIN.left, y, logoW, logoH);
    } catch { /* skip */ }
  } else {
    // Placeholder circle
    doc.setDrawColor(...hex(C.red));
    doc.setLineWidth(0.5);
    doc.circle(MARGIN.left + logoW / 2, y + logoH / 2, logoW / 2 - 1);
    doc.setFontSize(6);
    doc.setTextColor(...hex(C.red));
    doc.text("LOGO", MARGIN.left + logoW / 2, y + logoH / 2 + 1, { align: "center" });
  }

  // School emblem (right)
  const emblemX = PAGE.width - MARGIN.right - emblemW;
  if (opts.schoolEmblem) {
    try {
      doc.addImage(opts.schoolEmblem, "PNG", emblemX, y, emblemW, logoH);
    } catch { /* skip */ }
  } else {
    doc.setDrawColor(...hex(C.red));
    doc.setLineWidth(0.5);
    doc.circle(emblemX + emblemW / 2, y + logoH / 2, emblemW / 2 - 1);
    doc.setFontSize(6);
    doc.setTextColor(...hex(C.red));
    doc.text("EMBLEM", emblemX + emblemW / 2, y + logoH / 2 + 1, { align: "center" });
  }

  // School name
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.red));
  doc.text(opts.schoolName || "School Name", centerX, y + 6, { align: "center" });

  // Address
  if (opts.schoolAddress) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(C.black));
    doc.text(opts.schoolAddress, centerX, y + 11, { align: "center" });
  }

  // Helpline / phone
  if (opts.schoolPhone) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hex(C.red));
    doc.text(`Helpline ${opts.schoolPhone}`, centerX, y + 16, { align: "center" });
  }

  // Email + website
  const contactParts: string[] = [];
  if (opts.schoolEmail) contactParts.push(`Email : ${opts.schoolEmail}`);
  if (opts.schoolWebsite) contactParts.push(`Website : ${opts.schoolWebsite}`);
  if (contactParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(C.black));
    doc.text(contactParts.join("    "), centerX, y + 21, { align: "center" });
  }

  y += logoH + 3;

  // "Annual Term (Session ...)" title bar
  doc.setFillColor(...hex(C.red));
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, 7, "F");
  doc.setTextColor(...hex(C.white));
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Annual Term (Session ${data.academicYear})`,
    PAGE.width / 2,
    y + 4.8,
    { align: "center" },
  );
  y += 9;

  return y;
}

// ---------------------------------------------------------------------------
// 2. Student Info
// ---------------------------------------------------------------------------

function renderStudentInfo(
  doc: jsPDF,
  student: StudentInfoExtended,
  startY: number,
): number {
  const y = startY;
  const photoW = 25;
  const photoH = 30;
  const photoX = PAGE.width - MARGIN.right - photoW;
  const infoW = CONTENT_WIDTH - photoW - 4;

  // Border around entire student info area
  doc.setDrawColor(...hex(C.red));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, photoH + 2);

  // Photo box
  doc.setDrawColor(...hex(C.grey));
  doc.setLineWidth(0.3);
  doc.rect(photoX, y + 1, photoW, photoH);
  if (student.avatar) {
    try {
      doc.addImage(student.avatar, "JPEG", photoX + 0.5, y + 1.5, photoW - 1, photoH - 1);
    } catch { /* skip */ }
  } else {
    doc.setFontSize(6);
    doc.setTextColor(...hex(C.grey));
    doc.text("Photo", photoX + photoW / 2, y + photoH / 2 + 1, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(...hex(C.black));

  const col1X = MARGIN.left + 2;
  const col2X = MARGIN.left + infoW / 2 + 2;
  const rowH = 5;
  let iy = y + 5;

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

  return y + photoH + 4;
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
  // Section header bar
  doc.setFillColor(...hex(C.sectionBg));
  doc.rect(MARGIN.left, startY, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(...hex(C.white));
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Scholastic Subjects", MARGIN.left + 3, startY + 4.2);
  let y = startY + 6;

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;
  const t1Label = term1?.term.name || "Term 1";
  const t2Label = term2?.term.name || "Term 2";

  // Build header rows (3 levels)
  const head: any[][] = [
    [
      { content: "Subjects", rowSpan: 3, styles: { halign: "center", valign: "middle" } },
      { content: t1Label, colSpan: 5, styles: { halign: "center" } },
      { content: t2Label, colSpan: 5, styles: { halign: "center" } },
      { content: "Overall", colSpan: 2, styles: { halign: "center" } },
    ],
    [
      { content: "Periodic\nTest\n(10)", styles: { halign: "center" } },
      { content: "Multiple\nAssessment\n(5)", styles: { halign: "center" } },
      { content: "Portfolio\n(5)", styles: { halign: "center" } },
      { content: "Half\nYearly\n(80)", styles: { halign: "center" } },
      { content: "Total\n(100)", styles: { halign: "center" } },
      { content: "Periodic\nTest\n(10)", styles: { halign: "center" } },
      { content: "Multiple\nAssessment\n(5)", styles: { halign: "center" } },
      { content: "Portfolio\n(5)", styles: { halign: "center" } },
      { content: "Final\n(80)", styles: { halign: "center" } },
      { content: "Total\n(100)", styles: { halign: "center" } },
      { content: "Marks\nObtained", styles: { halign: "center" } },
      { content: "Grade", styles: { halign: "center" } },
    ],
  ];

  const subjects = data.annualSubjects;
  const body = subjects.map((subj) => {
    const t1s = findTermSubject(term1, subj.subjectId);
    const t2s = term2 ? findTermSubject(term2, subj.subjectId) : null;

    // Extract component marks by CBSE component name
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

    return [subj.subjectName, t1pt, t1ma, t1port, t1hy, t1tot, t2pt, t2ma, t2port, t2hy, t2tot, overall, grade];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(C.red),
      textColor: hex(C.white),
      fontStyle: "bold",
      halign: "center",
      fontSize: 6.5,
      cellPadding: 1,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: hex(C.black),
      halign: "center",
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 28 },
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
  const barH = 8;
  const perf = data.overallPerformance;

  // Total attendance across terms
  const totalDays = data.terms.reduce((s, t) => s + t.attendance.totalDays, 0);
  const totalPresent = data.terms.reduce((s, t) => s + t.attendance.daysPresent, 0);

  const cells = [
    { label: "Attendance", value: `${totalPresent}/${totalDays}` },
    { label: "Total Marks", value: `${perf.obtainedMarks}/${perf.maxMarks}` },
    { label: "Percentage", value: `${perf.percentage.toFixed(2)} %` },
    { label: "Grade", value: perf.grade || "-" },
  ];

  const cellW = CONTENT_WIDTH / cells.length;

  doc.setLineWidth(0.3);
  doc.setDrawColor(...hex(C.red));

  cells.forEach((cell, i) => {
    const cx = MARGIN.left + i * cellW;

    // Alternating fill
    if (i % 2 === 0) {
      doc.setFillColor(...hex(C.redBg));
    } else {
      doc.setFillColor(...hex(C.white));
    }
    doc.rect(cx, y, cellW, barH, "FD");

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hex(C.red));
    doc.text(cell.label, cx + cellW / 2, y + 3, { align: "center" });

    // Value
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hex(C.black));
    doc.text(cell.value, cx + cellW / 2, y + 6.5, { align: "center" });
  });

  return y + barH + 3;
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

  // Left header
  doc.setFillColor(...hex(C.sectionBg));
  doc.rect(MARGIN.left, y, halfW, 6, "F");
  doc.setTextColor(...hex(C.white));
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Co scholastic Subjects Area (on a 5 point grade scale)", MARGIN.left + 2, y + 4.2);

  // Right header
  const rightX = MARGIN.left + halfW + 2;
  doc.setFillColor(...hex(C.sectionBg));
  doc.rect(rightX, y, halfW, 6, "F");
  doc.text("Activities/Skill Subjects Areas (on a 3 point grade scale)", rightX + 2, y + 4.2);

  y += 6;

  // Left table
  const leftHead = [["SUBJECTS", t1Label, t2Label]];
  const leftBody = coScholastic.length > 0
    ? coScholastic.map((a) => [a.name, a.t1, a.t2])
    : [["—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    head: leftHead,
    body: leftBody,
    theme: "grid",
    headStyles: { fillColor: hex(C.red), textColor: hex(C.white), fontStyle: "bold", fontSize: 7, cellPadding: 1.5 },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: halfW - 20, halign: "left" }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 10, halign: "center" } },
    styles: { lineColor: hex(C.border), lineWidth: 0.2 },
    margin: { left: MARGIN.left, right: PAGE.width - MARGIN.left - halfW },
  });

  const leftFinalY = (doc as any).lastAutoTable.finalY;

  // Right table
  const rightHead = [["SUBJECTS", t1Label, t2Label]];
  const rightBody = skillActivities.length > 0
    ? skillActivities.map((a) => [a.name, a.t1, a.t2])
    : [["—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    head: rightHead,
    body: rightBody,
    theme: "grid",
    headStyles: { fillColor: hex(C.red), textColor: hex(C.white), fontStyle: "bold", fontSize: 7, cellPadding: 1.5 },
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
  let y = checkPageBreak(doc, startY, 20);

  // Section label
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(C.black));
  doc.text(
    "Grade Scale For Scholastic Areas (Grades are awarded on 8 Point Grade Scale As Follows) :",
    MARGIN.left,
    y + 4,
  );
  y += 6;

  const head = [["Marks Range (%)", ...gradeScale.map((g) => g.minMarks + "-" + g.maxMarks)]];
  const body = [["Grade", ...gradeScale.map((g) => g.grade)]];

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: hex(C.redBg), textColor: hex(C.black), fontStyle: "bold", fontSize: 7, cellPadding: 1.5, halign: "center" },
    bodyStyles: { fontSize: 7.5, textColor: hex(C.black), halign: "center", cellPadding: 1.5 },
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
  let y = checkPageBreak(doc, startY, 20);

  doc.setFontSize(8);
  doc.setTextColor(...hex(C.black));

  if (data.remarks.teacherRemarks) {
    doc.setFont("helvetica", "bold");
    doc.text("Remarks: ", MARGIN.left, y);
    const lw = doc.getTextWidth("Remarks: ");
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.teacherRemarks, CONTENT_WIDTH - lw - 2);
    doc.text(lines, MARGIN.left + lw, y);
    y += Math.max(lines.length * 4.5, 5) + 2;
  }

  if (data.remarks.principalRemarks) {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.principalRemarks, CONTENT_WIDTH - 2);
    doc.text(lines, MARGIN.left, y);
    y += Math.max(lines.length * 4.5, 5) + 2;
  }

  // Promotion line
  const status = data.resultStatus;
  if (status === "PASS") {
    const nextClass = getNextClass(data.student.class);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
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
  const y = Math.max(startY + 6, PAGE.height - 28);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex(C.black));

  const positions = [
    { x: MARGIN.left + 20, label: "Parent's Signature" },
    { x: PAGE.width / 2, label: "Class Incharge Signature" },
    { x: PAGE.width - MARGIN.right - 20, label: "Principal Signature" },
  ];

  for (const pos of positions) {
    // Signature line
    doc.setDrawColor(...hex(C.black));
    doc.setLineWidth(0.3);
    doc.line(pos.x - 18, y, pos.x + 18, y);
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
  renderDecorativeBorder(doc);
  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, opts, y);
  y = renderStudentInfo(doc, data.student, y);
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
  doc.setFillColor(...hex(C.sectionBg));
  doc.rect(MARGIN.left, startY, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(...hex(C.white));
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Scholastic Subjects (Class 9–10)", MARGIN.left + 3, startY + 4.2);
  const y = startY + 6;

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
    return [subj.subjectName, theory, practical, total, grade, status];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: hex(C.red), textColor: hex(C.white), fontStyle: "bold", halign: "center", fontSize: 7, cellPadding: 1.5 },
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
  renderDecorativeBorder(doc);
  let y = MARGIN.top + 2;
  y = renderHeader(doc, data, opts, y);
  y = renderStudentInfo(doc, data.student, y);
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
  doc.setFillColor(...hex(C.sectionBg));
  doc.rect(MARGIN.left, startY, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(...hex(C.white));
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Scholastic Subjects (Class 11–12)", MARGIN.left + 3, startY + 4.2);
  const y = startY + 6;

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
    return [subj.subjectName, theory, practical, total, grade, status];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: hex(C.red), textColor: hex(C.white), fontStyle: "bold", halign: "center", fontSize: 7, cellPadding: 1.5 },
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
