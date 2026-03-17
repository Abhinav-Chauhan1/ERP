/**
 * CBSE Report Card PDF Renderer
 *
 * Renders a multi-term (Term-1 / Term-2 / Annual) CBSE report card
 * following the standard CBSE format:
 *   1. School header with logo
 *   2. Student details box (name, class, section, DOB, parent info)
 *   3. Scholastic subjects table with dual-term columns
 *   4. Additional subjects table
 *   5. Co-scholastic areas table with dual-term grades
 *   6. Attendance row per term
 *   7. Result summary (grade/CGPA, pass/fail)
 *   8. Remarks and signatures
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  MultiTermReportCardData,
  TermSubjectResult,
  CoScholasticResult,
  StudentInfoExtended,
  TermSlice,
  CBSEGradeEntry,
} from "./report-card-data-aggregation";
import { getCBSEGradeScale } from "./report-card-data-aggregation";

// ---------------------------------------------------------------------------
// Config & styling constants
// ---------------------------------------------------------------------------

/** Page dimensions (A4, mm) */
const PAGE = { width: 210, height: 297 } as const;
const MARGIN = { left: 10, right: 10, top: 10, bottom: 10 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

/** Color palette — muted institutional blue/grey */
const COLORS = {
  primary: "#1a3a6b",       // dark navy
  secondary: "#3d6098",     // mid blue
  sectionHeader: "#2c5282", // blue for section titles
  headerText: "#FFFFFF",
  bodyText: "#1a1a1a",
  muted: "#6b7280",
  border: "#c8d6e5",
  altRow: "#f0f4f8",
  pass: "#16a34a",
  fail: "#dc2626",
  compartment: "#d97706",
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a complete CBSE report card PDF for one student.
 *
 * @returns PDF as a Buffer (Node) that can be stored / streamed.
 */
export async function generateCBSEReportCardPDF(
  data: MultiTermReportCardData,
  options: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string; // base64 data-URI
    affiliationNo?: string;
    schoolCode?: string;
  } = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Fetch grade scale for the school
  const gradeScale = await getCBSEGradeScale(data.student.schoolId);

  let y: number = MARGIN.top;

  // ── 1. Header ──────────────────────────────────────────────────────────
  y = renderHeader(doc, data, options, y);

  // ── 2. Student info box ────────────────────────────────────────────────
  y = renderStudentInfo(doc, data.student, y);

  // ── 3. Scholastic subjects (dual-term table) ───────────────────────────
  y = renderScholasticTable(doc, data, gradeScale, y);

  // ── Page break check ───────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 60);

  // ── 4. Additional subjects ─────────────────────────────────────────────
  if (data.annualAdditionalSubjects.length > 0) {
    y = renderAdditionalSubjectsTable(doc, data, gradeScale, y);
    y = checkPageBreak(doc, y, 50);
  }

  // ── 5. Co-scholastic areas ─────────────────────────────────────────────
  y = renderCoScholasticTable(doc, data, y);
  y = checkPageBreak(doc, y, 50);

  // ── 6. Attendance ──────────────────────────────────────────────────────
  y = renderAttendanceRow(doc, data, y);

  // ── 7. Result summary ──────────────────────────────────────────────────
  y = renderResultSummary(doc, data, y);

  // ── 8. Remarks ─────────────────────────────────────────────────────────
  y = renderRemarks(doc, data, y);

  // ── 9. Signatures ──────────────────────────────────────────────────────
  renderSignatures(doc, y);

  // ── 10. Grade scale footer ─────────────────────────────────────────────
  renderGradeScaleFooter(doc, gradeScale);

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate CBSE report cards in batch for multiple students.
 * Returns a single PDF with one report card per page-set.
 */
export async function generateBatchCBSEReportCards(
  dataList: MultiTermReportCardData[],
  options: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    affiliationNo?: string;
    schoolCode?: string;
  } = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let gradeScaleCache: CBSEGradeEntry[] | null = null;

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];

    // Cache grade scale (same school)
    if (!gradeScaleCache) {
      gradeScaleCache = await getCBSEGradeScale(data.student.schoolId);
    }

    if (i > 0) doc.addPage();

    let y: number = MARGIN.top;
    y = renderHeader(doc, data, options, y);
    y = renderStudentInfo(doc, data.student, y);
    y = renderScholasticTable(doc, data, gradeScaleCache, y);
    y = checkPageBreak(doc, y, 60);

    if (data.annualAdditionalSubjects.length > 0) {
      y = renderAdditionalSubjectsTable(doc, data, gradeScaleCache, y);
      y = checkPageBreak(doc, y, 50);
    }

    y = renderCoScholasticTable(doc, data, y);
    y = checkPageBreak(doc, y, 50);
    y = renderAttendanceRow(doc, data, y);
    y = renderResultSummary(doc, data, y);
    y = renderRemarks(doc, data, y);
    renderSignatures(doc, y);
    renderGradeScaleFooter(doc, gradeScaleCache);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** Utility: add a new page if content won't fit */
function checkPageBreak(doc: jsPDF, y: number, neededHeight: number): number {
  if (y + neededHeight > PAGE.height - MARGIN.bottom - 30) {
    doc.addPage();
    return MARGIN.top;
  }
  return y;
}

/** Utility: hex → RGB tuple */
function hex(color: string): [number, number, number] {
  const h = color.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Utility: draw a colored section title bar */
function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...hex(COLORS.sectionHeader));
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, 7, "F");
  doc.setTextColor(...hex(COLORS.headerText));
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN.left + 3, y + 5);
  return y + 9;
}

// ── 1. Header ────────────────────────────────────────────────────────────

function renderHeader(
  doc: jsPDF,
  data: MultiTermReportCardData,
  opts: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    affiliationNo?: string;
    schoolCode?: string;
  },
  startY: number,
): number {
  let y = startY;
  const centerX = PAGE.width / 2;

  // Logo (if provided)
  if (opts.schoolLogo) {
    try {
      doc.addImage(opts.schoolLogo, "PNG", centerX - 10, y, 20, 20);
      y += 22;
    } catch {
      // skip bad logo
    }
  }

  // School name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex(COLORS.primary));
  doc.text(opts.schoolName || "School Name", centerX, y, { align: "center" });
  y += 6;

  // Address
  if (opts.schoolAddress) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hex(COLORS.muted));
    doc.text(opts.schoolAddress, centerX, y, { align: "center" });
    y += 4;
  }

  // Affiliation / school code
  if (opts.affiliationNo || opts.schoolCode) {
    doc.setFontSize(8);
    const parts: string[] = [];
    if (opts.affiliationNo) parts.push(`Affiliation No: ${opts.affiliationNo}`);
    if (opts.schoolCode) parts.push(`School Code: ${opts.schoolCode}`);
    doc.text(parts.join("  |  "), centerX, y, { align: "center" });
    y += 4;
  }

  // Title
  y += 2;
  doc.setFillColor(...hex(COLORS.primary));
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, 8, "F");
  doc.setTextColor(...hex(COLORS.headerText));
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `REPORT CARD — ACADEMIC SESSION ${data.academicYear}`,
    centerX,
    y + 5.5,
    { align: "center" },
  );
  y += 12;

  return y;
}

// ── 2. Student Info ──────────────────────────────────────────────────────

function renderStudentInfo(
  doc: jsPDF,
  student: StudentInfoExtended,
  startY: number,
): number {
  let y = startY;

  // Draw a bordered box
  doc.setDrawColor(...hex(COLORS.border));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, 32);

  doc.setFontSize(9);
  doc.setTextColor(...hex(COLORS.bodyText));

  const col1 = MARGIN.left + 3;
  const col2 = MARGIN.left + 100;
  const rowH = 5;

  y += 5;

  // Row 1
  infoRow(doc, "Student Name", student.name, col1, y);
  infoRow(doc, "Admission No", student.admissionId, col2, y);
  y += rowH;

  // Row 2
  infoRow(doc, "Class / Section", `${student.class} - ${student.section}`, col1, y);
  infoRow(doc, "Roll No", student.rollNumber || "-", col2, y);
  y += rowH;

  // Row 3
  infoRow(doc, "Date of Birth", formatDate(student.dateOfBirth), col1, y);
  infoRow(doc, "Gender", student.gender || "-", col2, y);
  y += rowH;

  // Row 4 — parent info
  const fatherName = student.parent?.fatherName || "-";
  const motherName = student.parent?.motherName || "-";
  infoRow(doc, "Father's Name", fatherName, col1, y);
  infoRow(doc, "Mother's Name", motherName, col2, y);
  y += rowH;

  // Row 5
  if (student.parent?.guardianName) {
    infoRow(doc, "Guardian", `${student.parent.guardianName} (${student.parent.guardianRelation || ""})`, col1, y);
    y += rowH;
  }

  return startY + 36;
}

function infoRow(doc: jsPDF, label: string, value: string, x: number, y: number): void {
  doc.setFont("helvetica", "bold");
  doc.text(`${label}: `, x, y);
  const labelWidth = doc.getTextWidth(`${label}: `);
  doc.setFont("helvetica", "normal");
  doc.text(value, x + labelWidth, y);
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── 3. Scholastic Subjects Table ─────────────────────────────────────────

/**
 * Builds a dual-term table like:
 *
 * | Subject | Term-1 | Grade | Term-2 | Grade | Total | Grade | GP |
 */
function renderScholasticTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  gradeScale: CBSEGradeEntry[],
  startY: number,
): number {
  let y = sectionTitle(doc, "PART I — SCHOLASTIC AREAS", startY);

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;
  const term1Label = term1?.term.name || "Term-1";
  const term2Label = term2?.term.name || "Term-2";

  // Build header (nested-style via colspan strings)
  const headers = [
    [
      { content: "Subject", rowSpan: 2, styles: { halign: "center" as const, valign: "middle" as const } },
      { content: term1Label, colSpan: 2, styles: { halign: "center" as const } },
      ...(term2
        ? [{ content: term2Label, colSpan: 2, styles: { halign: "center" as const } }]
        : []),
      { content: "Annual", colSpan: 3, styles: { halign: "center" as const } },
    ],
    [
      { content: "Marks", styles: { halign: "center" as const } },
      { content: "Grade", styles: { halign: "center" as const } },
      ...(term2
        ? [
            { content: "Marks", styles: { halign: "center" as const } },
            { content: "Grade", styles: { halign: "center" as const } },
          ]
        : []),
      { content: "Total", styles: { halign: "center" as const } },
      { content: "Grade", styles: { halign: "center" as const } },
      { content: "GP", styles: { halign: "center" as const } },
    ],
  ];

  // Build body rows
  const subjects = data.annualSubjects;
  const body = subjects.map((subj) => {
    const t1 = findTermSubject(term1, subj.subjectId);
    const t2 = term2 ? findTermSubject(term2, subj.subjectId) : null;

    const row: (string | { content: string; styles?: Record<string, unknown> })[] = [
      subj.subjectName,
      marksCell(t1),
      gradeCell(t1),
    ];

    if (term2) {
      row.push(marksCell(t2));
      row.push(gradeCell(t2));
    }

    row.push(`${subj.totalMarks}/${subj.maxMarks}`);
    row.push(subj.grade || "-");
    row.push(subj.gradePoint?.toString() || "-");

    return row;
  });

  autoTable(doc, {
    startY: y,
    head: headers,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(COLORS.secondary),
      textColor: hex(COLORS.headerText),
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: hex(COLORS.bodyText),
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
    },
    alternateRowStyles: {
      fillColor: hex(COLORS.altRow),
    },
    styles: {
      lineColor: hex(COLORS.border),
      lineWidth: 0.15,
      cellPadding: 2,
    },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

// ── 4. Additional Subjects ───────────────────────────────────────────────

function renderAdditionalSubjectsTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  gradeScale: CBSEGradeEntry[],
  startY: number,
): number {
  let y = sectionTitle(doc, "ADDITIONAL SUBJECTS", startY);

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;

  const headers: any[][] = [
    [
      "Subject",
      "Marks",
      "Grade",
      ...(term2 ? ["Marks", "Grade"] : []),
      "Total",
      "Grade",
      "GP",
    ],
  ];

  const body = data.annualAdditionalSubjects.map((subj) => {
    const t1 = findTermSubject(term1, subj.subjectId);
    const t2 = term2 ? findTermSubject(term2, subj.subjectId) : null;

    return [
      subj.subjectName,
      marksCell(t1),
      gradeCell(t1),
      ...(term2 ? [marksCell(t2), gradeCell(t2)] : []),
      `${subj.totalMarks}/${subj.maxMarks}`,
      subj.grade || "-",
      subj.gradePoint?.toString() || "-",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: headers,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(COLORS.secondary),
      textColor: hex(COLORS.headerText),
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: hex(COLORS.bodyText),
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
    },
    alternateRowStyles: {
      fillColor: hex(COLORS.altRow),
    },
    styles: {
      lineColor: hex(COLORS.border),
      lineWidth: 0.15,
      cellPadding: 2,
    },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

// ── 5. Co-Scholastic Table ───────────────────────────────────────────────

function renderCoScholasticTable(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = sectionTitle(doc, "PART II — CO-SCHOLASTIC AREAS", startY);

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;
  const term1Label = term1?.term.name || "Term-1";
  const term2Label = term2?.term.name || "Term-2";

  // Merge all co-scholastic activity names from both terms
  const activityMap = new Map<string, { name: string; t1Grade: string; t2Grade: string }>();

  if (term1) {
    for (const cs of term1.coScholastic) {
      activityMap.set(cs.activityId, {
        name: cs.activityName,
        t1Grade: cs.grade || "-",
        t2Grade: "-",
      });
    }
  }
  if (term2) {
    for (const cs of term2.coScholastic) {
      const existing = activityMap.get(cs.activityId);
      if (existing) {
        existing.t2Grade = cs.grade || "-";
      } else {
        activityMap.set(cs.activityId, {
          name: cs.activityName,
          t1Grade: "-",
          t2Grade: cs.grade || "-",
        });
      }
    }
  }

  if (activityMap.size === 0) return y;

  const headers: string[][] = [
    [
      "Activity",
      `${term1Label} Grade`,
      ...(term2 ? [`${term2Label} Grade`] : []),
    ],
  ];

  const body = Array.from(activityMap.values()).map((a) => [
    a.name,
    a.t1Grade,
    ...(term2 ? [a.t2Grade] : []),
  ]);

  autoTable(doc, {
    startY: y,
    head: headers,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(COLORS.secondary),
      textColor: hex(COLORS.headerText),
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: hex(COLORS.bodyText),
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 80 },
    },
    styles: {
      lineColor: hex(COLORS.border),
      lineWidth: 0.15,
      cellPadding: 2,
    },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

// ── 6. Attendance ────────────────────────────────────────────────────────

function renderAttendanceRow(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = sectionTitle(doc, "ATTENDANCE", startY);

  const term1 = data.terms[0];
  const term2 = data.terms.length > 1 ? data.terms[1] : null;

  const headers: string[][] = [
    [
      "",
      "Total Days",
      "Present",
      "Absent",
      "Percentage",
    ],
  ];

  const body: string[][] = [];

  if (term1) {
    body.push([
      term1.term.name || "Term-1",
      term1.attendance.totalDays.toString(),
      term1.attendance.daysPresent.toString(),
      term1.attendance.daysAbsent.toString(),
      `${term1.attendance.percentage.toFixed(1)}%`,
    ]);
  }

  if (term2) {
    body.push([
      term2.term.name || "Term-2",
      term2.attendance.totalDays.toString(),
      term2.attendance.daysPresent.toString(),
      term2.attendance.daysAbsent.toString(),
      `${term2.attendance.percentage.toFixed(1)}%`,
    ]);
  }

  // Annual total
  const totalDays = data.terms.reduce((s, t) => s + t.attendance.totalDays, 0);
  const totalPresent = data.terms.reduce((s, t) => s + t.attendance.daysPresent, 0);
  const totalAbsent = data.terms.reduce((s, t) => s + t.attendance.daysAbsent, 0);
  const annualPct = totalDays > 0 ? ((totalPresent / totalDays) * 100) : 0;

  body.push([
    "Annual",
    totalDays.toString(),
    totalPresent.toString(),
    totalAbsent.toString(),
    `${annualPct.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: headers,
    body,
    theme: "grid",
    headStyles: {
      fillColor: hex(COLORS.secondary),
      textColor: hex(COLORS.headerText),
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: hex(COLORS.bodyText),
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
    },
    styles: {
      lineColor: hex(COLORS.border),
      lineWidth: 0.15,
      cellPadding: 2,
    },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

// ── 7. Result Summary ────────────────────────────────────────────────────

function renderResultSummary(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = sectionTitle(doc, "RESULT", startY);

  const perf = data.overallPerformance;
  const col1 = MARGIN.left + 5;
  const col2 = MARGIN.left + 100;

  doc.setFontSize(10);
  doc.setTextColor(...hex(COLORS.bodyText));

  // Row 1
  infoRow(doc, "Total Marks", `${perf.obtainedMarks} / ${perf.maxMarks}`, col1, y);
  infoRow(doc, "Percentage", `${perf.percentage.toFixed(2)}%`, col2, y);
  y += 6;

  // Row 2
  infoRow(doc, "Overall Grade", perf.grade || "-", col1, y);
  infoRow(doc, "CGPA", perf.cgpa?.toFixed(1) || "-", col2, y);
  y += 6;

  // Result status with color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Result: ", col1, y);

  const status = data.resultStatus || "-";
  const statusColor =
    status === "PASS"
      ? COLORS.pass
      : status === "FAIL"
        ? COLORS.fail
        : status === "COMPARTMENT"
          ? COLORS.compartment
          : COLORS.bodyText;

  doc.setTextColor(...hex(statusColor));
  doc.text(status, col1 + doc.getTextWidth("Result: "), y);
  doc.setTextColor(...hex(COLORS.bodyText));
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  return y;
}

// ── 8. Remarks ───────────────────────────────────────────────────────────

function renderRemarks(
  doc: jsPDF,
  data: MultiTermReportCardData,
  startY: number,
): number {
  let y = checkPageBreak(doc, startY, 30);
  y = sectionTitle(doc, "REMARKS", y);

  doc.setFontSize(9);
  doc.setTextColor(...hex(COLORS.bodyText));

  if (data.remarks.teacherRemarks) {
    doc.setFont("helvetica", "bold");
    doc.text("Class Teacher:", MARGIN.left + 3, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.teacherRemarks, CONTENT_WIDTH - 30);
    doc.text(lines, MARGIN.left + 35, y);
    y += Math.max(lines.length * 4, 5) + 3;
  }

  if (data.remarks.principalRemarks) {
    doc.setFont("helvetica", "bold");
    doc.text("Principal:", MARGIN.left + 3, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.remarks.principalRemarks, CONTENT_WIDTH - 30);
    doc.text(lines, MARGIN.left + 35, y);
    y += Math.max(lines.length * 4, 5) + 3;
  }

  return y + 2;
}

// ── 9. Signatures ────────────────────────────────────────────────────────

function renderSignatures(doc: jsPDF, startY: number): void {
  const y = Math.max(startY + 5, PAGE.height - 40);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex(COLORS.bodyText));

  const positions = [
    { x: 35, label: "Class Teacher" },
    { x: PAGE.width / 2, label: "Parent/Guardian" },
    { x: PAGE.width - 35, label: "Principal" },
  ];

  for (const pos of positions) {
    doc.text("_________________", pos.x, y, { align: "center" });
    doc.text(pos.label, pos.x, y + 5, { align: "center" });
  }
}

// ── 10. Grade Scale Footer ───────────────────────────────────────────────

function renderGradeScaleFooter(doc: jsPDF, gradeScale: CBSEGradeEntry[]): void {
  const y = PAGE.height - 18;

  doc.setDrawColor(...hex(COLORS.border));
  doc.setLineWidth(0.2);
  doc.line(MARGIN.left, y - 3, PAGE.width - MARGIN.right, y - 3);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...hex(COLORS.muted));

  // Build grade scale string
  const scaleStr = gradeScale
    .map((g) => `${g.grade}(${g.minMarks}-${g.maxMarks})=${g.gradePoint}GP`)
    .join("  |  ");

  doc.text(`Grade Scale: ${scaleStr}`, MARGIN.left, y);
  doc.text(
    "This is a computer-generated report card.",
    PAGE.width - MARGIN.right,
    y + 4,
    { align: "right" },
  );
}

// ---------------------------------------------------------------------------
// Data look-up helpers
// ---------------------------------------------------------------------------

function findTermSubject(
  termSlice: TermSlice | null | undefined,
  subjectId: string,
): TermSubjectResult | null {
  if (!termSlice) return null;
  return termSlice.subjects.find((s) => s.subjectId === subjectId) ?? null;
}

function marksCell(subj: TermSubjectResult | null): string {
  if (!subj) return "-";
  if (subj.isAbsent) return "AB";
  return `${subj.totalMarks}/${subj.maxMarks}`;
}

function gradeCell(subj: TermSubjectResult | null): string {
  if (!subj) return "-";
  if (subj.isAbsent) return "AB";
  return subj.grade || "-";
}
