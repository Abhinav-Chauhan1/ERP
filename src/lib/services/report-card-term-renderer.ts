/**
 * Term / Exam-Type Report Card PDF Renderer
 *
 * Standalone renderer for single-term and per-exam-type report cards.
 * Uses the same visual design as the CBSE annual renderer — no template required:
 *   - Decorative border (public/border.png)
 *   - School header: logo | school name + address | emblem
 *   - Title bar with term / exam-type name
 *   - Student info grid with photo placeholder
 *   - Scholastic subjects table (with theory/practical/internal breakdown when present)
 *   - Summary bar: attendance | total marks | percentage | grade
 *   - Co-scholastic section (if any)
 *   - Grade scale legend
 *   - Remarks + Signatures
 */

import fs from "fs";
import path from "path";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportCardData } from "./report-card-data-aggregation";

// ---------------------------------------------------------------------------
// Layout constants — identical to CBSE renderer
// ---------------------------------------------------------------------------
const PAGE = { width: 210, height: 297 } as const;
const MARGIN = { left: 12, right: 12, top: 12, bottom: 12 } as const;
const CW = PAGE.width - MARGIN.left - MARGIN.right; // content width = 186 mm

const C = {
  red:       "#C0392B",
  black:     "#1a1a1a",
  border:    "#999999",
  altRow:    "#f9f9f9",
  greyLight: "#f0f0f0",
  headerBg:  "#2c3e50",
} as const;

const GRADE_SCALE = [
  { range: "91–100", grade: "A1" },
  { range: "81–90",  grade: "A2" },
  { range: "71–80",  grade: "B1" },
  { range: "61–70",  grade: "B2" },
  { range: "51–60",  grade: "C1" },
  { range: "41–50",  grade: "C2" },
  { range: "33–40",  grade: "D"  },
  { range: "< 33",   grade: "E"  },
];

// ---------------------------------------------------------------------------
// Image helpers (same pattern as CBSE renderer)
// ---------------------------------------------------------------------------

let _borderCache: string | null = null;
function getBorderBase64(): string | null {
  if (_borderCache !== null) return _borderCache;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "border.png"));
    _borderCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { _borderCache = ""; }
  return _borderCache || null;
}


async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url || url.startsWith("data:")) return url;
  // For R2 objects (proxy URL or legacy pub URL), fetch via S3 SDK to bypass auth
  const key = extractR2Key(url);
  if (key) {
    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const accountId       = process.env.R2_ACCOUNT_ID;
      const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucketName      = process.env.R2_BUCKET_NAME;
      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      const res = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const ct  = res.ContentType || "image/png";
      return `data:${ct};base64,${buf.toString("base64")}`;
    } catch { return null; }
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "image/jpeg";
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch { return null; }
}

function extractR2Key(url: string): string | null {
  if (url.includes("/api/r2/image")) {
    try {
      const u = new URL(url, "http://localhost");
      return u.searchParams.get("key");
    } catch { return null; }
  }
  try {
    const u = new URL(url);
    if (u.hostname.match(/^pub-[^.]+\.r2\.dev$/)) return u.pathname.replace(/^\//, "");
  } catch { /* ignore */ }
  return null;
}

function detectFormat(src: string): "PNG" | "JPEG" | "WEBP" {
  if (src.startsWith("data:image/png") || /\.png(\?|$)/i.test(src)) return "PNG";
  if (src.startsWith("data:image/webp") || /\.webp(\?|$)/i.test(src)) return "WEBP";
  return "JPEG";
}

function safeImg(doc: jsPDF, src: string, x: number, y: number, w: number, h: number): void {
  try { doc.addImage(src, detectFormat(src), x, y, w, h); } catch { /* skip */ }
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function pageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.height - MARGIN.bottom - 20) {
    doc.addPage();
    drawBorder(doc);
    return MARGIN.top + 4;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TermRendererOptions {
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  /** Override the title bar label, e.g. "Mid-Term Exam Report Card" */
  reportLabel?: string;
}

export async function generateTermReportCardPDF(
  data: ReportCardData,
  options: TermRendererOptions = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let schoolLogo = options.schoolLogo;
  if (schoolLogo && !schoolLogo.startsWith("data:")) {
    schoolLogo = (await fetchImageAsBase64(schoolLogo)) ?? undefined;
  }
  let studentAvatar = data.student.avatar ?? undefined;
  if (studentAvatar && (studentAvatar.startsWith("http") || studentAvatar.includes("/api/r2/image"))) {
    studentAvatar = (await fetchImageAsBase64(studentAvatar)) ?? undefined;
  }

  drawBorder(doc);
  const opts = { ...options, schoolLogo };
  let y = MARGIN.top + 2;
  y = drawHeader(doc, data, opts, y);
  y = drawStudentInfo(doc, data, studentAvatar, y);
  y = drawScholasticTable(doc, data, y);
  y = drawSummaryBar(doc, data, y);
  if (data.coScholastic.length > 0) y = drawCoScholastic(doc, data, y);
  y = drawGradeScale(doc, y);
  y = drawRemarks(doc, data, y);
  drawSignatures(doc, y);

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateBatchTermReportCardsPDF(
  dataList: ReportCardData[],
  options: TermRendererOptions = {},
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let schoolLogo = options.schoolLogo;
  if (schoolLogo && !schoolLogo.startsWith("data:")) {
    schoolLogo = (await fetchImageAsBase64(schoolLogo)) ?? undefined;
  }
  const opts = { ...options, schoolLogo };

  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) doc.addPage();
    const data = dataList[i];
    let studentAvatar = data.student.avatar ?? undefined;
    if (studentAvatar && (studentAvatar.startsWith("http") || studentAvatar.includes("/api/r2/image"))) {
      studentAvatar = (await fetchImageAsBase64(studentAvatar)) ?? undefined;
    }
    drawBorder(doc);
    let y = MARGIN.top + 2;
    y = drawHeader(doc, data, opts, y);
    y = drawStudentInfo(doc, data, studentAvatar, y);
    y = drawScholasticTable(doc, data, y);
    y = drawSummaryBar(doc, data, y);
    if (data.coScholastic.length > 0) y = drawCoScholastic(doc, data, y);
    y = drawGradeScale(doc, y);
    y = drawRemarks(doc, data, y);
    drawSignatures(doc, y);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function drawBorder(doc: jsPDF): void {
  const b = getBorderBase64();
  if (b) try { doc.addImage(b, "PNG", 0, 0, PAGE.width, PAGE.height); } catch { /* skip */ }
}

function drawHeader(
  doc: jsPDF,
  data: ReportCardData,
  opts: TermRendererOptions,
  startY: number,
): number {
  let y = startY;
  const logoW = 22, logoH = 22;
  // Center text on the full content width, not the post-logo area
  const cx = MARGIN.left + CW / 2;

  // School logo (left)
  if (opts.schoolLogo) {
    safeImg(doc, opts.schoolLogo, MARGIN.left, y, logoW, logoH);
  } else {
    doc.setDrawColor(...rgb(C.red));
    doc.setLineWidth(0.5);
    doc.circle(MARGIN.left + logoW / 2, y + logoH / 2, logoW / 2 - 1);
    doc.setFontSize(6);
    doc.setTextColor(...rgb(C.red));
    doc.text("LOGO", MARGIN.left + logoW / 2, y + logoH / 2 + 1, { align: "center" });
  }

  // School name — large, bold, red
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...rgb(C.red));
  doc.text(opts.schoolName || "School Name", cx, y + 7, { align: "center" });

  const nameW = doc.getTextWidth(opts.schoolName || "School Name");
  doc.setDrawColor(...rgb(C.red));
  doc.setLineWidth(0.4);
  doc.line(cx - nameW / 2, y + 8.5, cx + nameW / 2, y + 8.5);

  if (opts.schoolAddress) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(C.black));
    doc.text(opts.schoolAddress, cx, y + 12.5, { align: "center" });
  }

  if (opts.schoolPhone) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(192, 0, 128);
    doc.text(`Helpline  ${opts.schoolPhone}`, cx, y + 17.5, { align: "center" });
  }

  if (opts.schoolEmail) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(C.black));
    doc.text(`Email: ${opts.schoolEmail}`, cx, y + 22, { align: "center" });
  }

  y += logoH + 3;

  // Title bar
  const barH = 8;
  doc.setFillColor(240, 240, 240);
  doc.setDrawColor(...rgb(C.border));
  doc.setLineWidth(0.3);
  doc.rect(MARGIN.left, y, CW, barH, "FD");

  const label = opts.reportLabel ?? `${data.term.name} Report Card`;
  // Shorten "2026-2027" → "2026-27"
  const shortYear = data.academicYear.replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2');
  const session = `(Session ${shortYear})`;

  doc.setTextColor(...rgb(C.black));
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(label, MARGIN.left + CW / 2, y + 5.5, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(session, MARGIN.left + CW - 2, y + 5.5, { align: "right" });

  return y + barH + 3;
}

function drawStudentInfo(
  doc: jsPDF,
  data: ReportCardData,
  avatar: string | undefined,
  startY: number,
): number {
  const PHOTO_W = 22, PHOTO_H = 26;
  const photoX = PAGE.width - MARGIN.right - PHOTO_W;
  const infoW = CW - PHOTO_W - 4;
  const BOX_H = PHOTO_H;
  let y = startY;

  // Info box
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(...rgb(C.border));
  doc.setLineWidth(0.25);
  doc.rect(MARGIN.left, y, infoW, BOX_H, "FD");

  // Photo box
  doc.rect(photoX, y, PHOTO_W, PHOTO_H, "S");
  if (avatar) {
    safeImg(doc, avatar, photoX, y, PHOTO_W, PHOTO_H);
  } else {
    doc.setFontSize(6);
    doc.setTextColor(...rgb(C.border));
    doc.text("PHOTO", photoX + PHOTO_W / 2, y + PHOTO_H / 2 + 1, { align: "center" });
  }

  const lx1 = MARGIN.left + 3;
  const vx1 = MARGIN.left + 38;
  const lx2 = MARGIN.left + infoW / 2 + 3;
  const vx2 = lx2 + 30;
  const lh = 6;
  let iy = y + 5.5;

  const field = (label: string, val: string, lx = lx1, vx = vx1) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...rgb(C.black));
    doc.text(label + ":", lx, iy);
    doc.setFont("helvetica", "normal");
    doc.text(val || "—", vx, iy);
  };

  const dob = data.student.dateOfBirth
    ? new Date(data.student.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  field("Name", data.student.name);
  field("Adm. No", data.student.admissionId, lx2, vx2);
  iy += lh;
  field("Class", `${data.student.class} – ${data.student.section}`);
  field("Roll No", data.student.rollNumber || "—", lx2, vx2);
  iy += lh;
  field("Date of Birth", dob);
  field("Acad. Year", data.academicYear, lx2, vx2);
  iy += lh;
  field("Term", data.term.name);
  if (data.overallPerformance.rank) {
    field("Rank", String(data.overallPerformance.rank), lx2, vx2);
  }

  return y + BOX_H + 4;
}

function drawScholasticTable(doc: jsPDF, data: ReportCardData, startY: number): number {
  let y = pageBreak(doc, startY, 40);

  // Section title bar
  doc.setFillColor(...rgb(C.red));
  doc.rect(MARGIN.left, y, CW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SCHOLASTIC AREAS", MARGIN.left + 3, y + 5);
  y += 9;

  // Only show breakdown columns when at least one subject has a positive max marks for that component
  const hasTheory    = data.subjects.some(s => s.theoryMaxMarks !== null && s.theoryMaxMarks > 0);
  const hasPractical = data.subjects.some(s => s.practicalMaxMarks !== null && s.practicalMaxMarks > 0);
  const hasInternal  = data.subjects.some(s => s.internalMaxMarks !== null && s.internalMaxMarks > 0);

  const head: string[] = ["Subject"];
  if (hasTheory)    head.push("Theory");
  if (hasPractical) head.push("Practical");
  if (hasInternal)  head.push("Internal");
  head.push("Obtained", "Max Marks", "%", "Grade");

  const body: any[][] = data.subjects.map(s => {
    const row: any[] = [s.subjectName];
    if (s.isAbsent) {
      if (hasTheory)    row.push("AB");
      if (hasPractical) row.push("AB");
      if (hasInternal)  row.push("AB");
      row.push("AB", s.maxMarks, "—", "AB");
    } else {
      if (hasTheory)    row.push(s.theoryMarks !== null    ? `${s.theoryMarks}/${s.theoryMaxMarks}`       : "—");
      if (hasPractical) row.push(s.practicalMarks !== null ? `${s.practicalMarks}/${s.practicalMaxMarks}` : "—");
      if (hasInternal)  row.push(s.internalMarks !== null  ? `${s.internalMarks}/${s.internalMaxMarks}`   : "—");
      row.push(s.totalMarks, s.maxMarks, `${s.percentage.toFixed(1)}%`, s.grade || "—");
    }
    return row;
  });

  const totalRow: any[] = [{ content: "OVERALL", styles: { fontStyle: "bold" } }];
  if (hasTheory)    totalRow.push("");
  if (hasPractical) totalRow.push("");
  if (hasInternal)  totalRow.push("");
  totalRow.push(
    { content: String(data.overallPerformance.obtainedMarks), styles: { fontStyle: "bold" } },
    { content: String(data.overallPerformance.maxMarks),      styles: { fontStyle: "bold" } },
    { content: `${data.overallPerformance.percentage.toFixed(1)}%`, styles: { fontStyle: "bold" } },
    { content: data.overallPerformance.grade || "—",          styles: { fontStyle: "bold" } },
  );
  body.push(totalRow);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "grid",
    headStyles: {
      fillColor: rgb(C.headerBg),
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: rgb(C.black) as [number, number, number] },
    alternateRowStyles: { fillColor: [249, 249, 249] as [number, number, number] },
    styles: { lineColor: rgb(C.border) as [number, number, number], lineWidth: 0.15 },
    columnStyles: { 0: { cellWidth: 42 } },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

function drawSummaryBar(doc: jsPDF, data: ReportCardData, startY: number): number {
  let y = pageBreak(doc, startY, 12);
  const barH = 10;
  const quarters = CW / 4;

  doc.setFillColor(...rgb(C.headerBg));
  doc.rect(MARGIN.left, y, CW, barH, "F");

  const cells = [
    { label: "Attendance", value: `${data.attendance.percentage.toFixed(1)}%` },
    { label: "Total Marks", value: `${data.overallPerformance.obtainedMarks} / ${data.overallPerformance.maxMarks}` },
    { label: "Percentage",  value: `${data.overallPerformance.percentage.toFixed(1)}%` },
    { label: "Grade",       value: data.overallPerformance.grade || "—" },
  ];

  cells.forEach((cell, i) => {
    const cx = MARGIN.left + quarters * i + quarters / 2;
    // Vertical divider (except before first)
    if (i > 0) {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.line(MARGIN.left + quarters * i, y + 1, MARGIN.left + quarters * i, y + barH - 1);
    }
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(cell.label, cx, y + 4, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(cell.value, cx, y + 8.5, { align: "center" });
  });

  return y + barH + 4;
}

function drawCoScholastic(doc: jsPDF, data: ReportCardData, startY: number): number {
  let y = pageBreak(doc, startY, 20);

  doc.setFillColor(...rgb(C.red));
  doc.rect(MARGIN.left, y, CW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CO-SCHOLASTIC AREAS", MARGIN.left + 3, y + 5);
  y += 9;

  const body = data.coScholastic.map(a => {
    const assessment =
      a.assessmentType === "GRADE"
        ? a.grade || "—"
        : a.marks !== null
        ? `${a.marks}/${a.maxMarks}`
        : "—";
    return [a.activityName, assessment, a.remarks || "—"];
  });

  autoTable(doc, {
    startY: y,
    head: [["Activity / Subject", "Grade / Marks", "Remarks"]],
    body,
    theme: "grid",
    headStyles: { fillColor: rgb(C.headerBg), textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: rgb(C.black) as [number, number, number] },
    alternateRowStyles: { fillColor: [249, 249, 249] as [number, number, number] },
    styles: { lineColor: rgb(C.border) as [number, number, number], lineWidth: 0.15 },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30, halign: "center" } },
    margin: { left: MARGIN.left, right: MARGIN.right },
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

function drawGradeScale(doc: jsPDF, startY: number): number {
  let y = pageBreak(doc, startY, 16);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...rgb(C.black));
  doc.text("GRADING SCALE", MARGIN.left, y + 4);

  const colW = CW / GRADE_SCALE.length;
  GRADE_SCALE.forEach((g, i) => {
    const x = MARGIN.left + colW * i;
    doc.setFillColor(i % 2 === 0 ? 240 : 248, i % 2 === 0 ? 240 : 248, i % 2 === 0 ? 240 : 248);
    doc.setDrawColor(...rgb(C.border));
    doc.setLineWidth(0.2);
    doc.rect(x, y + 6, colW, 8, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(C.black));
    doc.text(g.range, x + colW / 2, y + 10, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(g.grade, x + colW / 2, y + 13.5, { align: "center" });
  });

  return y + 20;
}

function drawRemarks(doc: jsPDF, data: ReportCardData, startY: number): number {
  const { teacherRemarks, principalRemarks } = data.remarks;
  if (!teacherRemarks && !principalRemarks) return startY;

  let y = pageBreak(doc, startY, 16);

  doc.setFillColor(...rgb(C.red));
  doc.rect(MARGIN.left, y, CW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("REMARKS", MARGIN.left + 3, y + 5);
  y += 10;

  const write = (label: string, text: string) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...rgb(C.black));
    doc.text(label + ":", MARGIN.left, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, CW);
    doc.text(lines, MARGIN.left, y);
    y += lines.length * 4.5 + 3;
  };

  if (teacherRemarks)   write("Class Teacher's Remarks", teacherRemarks);
  if (principalRemarks) write("Principal's Remarks",     principalRemarks);

  return y + 2;
}

function drawSignatures(doc: jsPDF, startY: number): void {
  let y = pageBreak(doc, startY, 20);
  y = Math.max(y, PAGE.height - MARGIN.bottom - 22);

  const positions = [
    { x: MARGIN.left + CW * 0.15, label: "Class Teacher" },
    { x: MARGIN.left + CW * 0.50, label: "Exam Coordinator" },
    { x: MARGIN.left + CW * 0.85, label: "Principal" },
  ];

  positions.forEach(({ x, label }) => {
    doc.setDrawColor(...rgb(C.black));
    doc.setLineWidth(0.3);
    doc.line(x - 18, y + 10, x + 18, y + 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(C.black));
    doc.text(label, x, y + 15, { align: "center" });
  });
}
