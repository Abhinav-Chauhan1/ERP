// PDF generation utility for report cards and receipts
// This uses a server-side approach with dynamic imports

import type { ProgressReportData } from "@/types/performance";
import type { ReceiptData } from "@/types/fees";
import { format } from "date-fns";

/**
 * Generate HTML template for report card
 */
function generateReportCardHTML(data: ProgressReportData): string {
  const {
    student,
    term,
    academicPerformance,
    attendance,
    teacherRemarks,
    principalRemarks,
    strengths,
    areasForImprovement,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Report Card - ${student.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .school-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .report-title {
          font-size: 20px;
          color: #4b5563;
          margin-top: 10px;
        }
        
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f3f4f6;
          border-radius: 8px;
        }
        
        .info-item {
          display: flex;
          gap: 10px;
        }
        
        .info-label {
          font-weight: bold;
          color: #4b5563;
        }
        
        .info-value {
          color: #1f2937;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin: 25px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .performance-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .summary-card {
          padding: 15px;
          background-color: #eff6ff;
          border-radius: 8px;
          text-align: center;
        }
        
        .summary-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        
        .results-table th {
          background-color: #2563eb;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .results-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .results-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .grade-excellent {
          color: #059669;
          font-weight: bold;
        }
        
        .grade-good {
          color: #2563eb;
          font-weight: bold;
        }
        
        .grade-average {
          color: #d97706;
          font-weight: bold;
        }
        
        .grade-poor {
          color: #dc2626;
          font-weight: bold;
        }
        
        .remarks-section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }
        
        .remarks-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .remarks-text {
          color: #78350f;
          line-height: 1.6;
        }
        
        .strengths-weaknesses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .list-section {
          padding: 15px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        
        .list-title {
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .list-section ul {
          list-style-position: inside;
          color: #4b5563;
        }
        
        .list-section li {
          margin-bottom: 5px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          width: 200px;
          border-top: 2px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 14px;
          color: #4b5563;
        }
        
        .print-date {
          text-align: right;
          color: #6b7280;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">School Management System</div>
        <div class="report-title">Academic Progress Report</div>
        <div style="margin-top: 10px; color: #6b7280;">${term.name} - ${term.academicYear}</div>
      </div>
      
      <div class="student-info">
        <div class="info-item">
          <span class="info-label">Student Name:</span>
          <span class="info-value">${student.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Admission ID:</span>
          <span class="info-value">${student.admissionId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Class:</span>
          <span class="info-value">${student.class} - ${student.section}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Roll Number:</span>
          <span class="info-value">${student.rollNumber || "N/A"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Birth:</span>
          <span class="info-value">${format(new Date(student.dateOfBirth), "MMM dd, yyyy")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Term Period:</span>
          <span class="info-value">${format(new Date(term.startDate), "MMM dd")} - ${format(new Date(term.endDate), "MMM dd, yyyy")}</span>
        </div>
      </div>
      
      <div class="section-title">Academic Performance Summary</div>
      <div class="performance-summary">
        <div class="summary-card">
          <div class="summary-label">Total Marks</div>
          <div class="summary-value">${academicPerformance.totalMarks || "N/A"}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Percentage</div>
          <div class="summary-value">${academicPerformance.percentage?.toFixed(2) || "N/A"}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Grade</div>
          <div class="summary-value">${academicPerformance.grade || "N/A"}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Rank</div>
          <div class="summary-value">${academicPerformance.rank || "N/A"}</div>
        </div>
      </div>
      
      <div class="section-title">Subject-wise Performance</div>
      <table class="results-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Marks Obtained</th>
            <th>Total Marks</th>
            <th>Percentage</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          ${academicPerformance.subjectResults.map(result => {
            const gradeClass = 
              result.percentage >= 80 ? "grade-excellent" :
              result.percentage >= 60 ? "grade-good" :
              result.percentage >= 40 ? "grade-average" : "grade-poor";
            
            return `
              <tr>
                <td>${result.subject}</td>
                <td>${result.marks}</td>
                <td>${result.totalMarks}</td>
                <td>${result.percentage.toFixed(2)}%</td>
                <td class="${gradeClass}">${result.grade || "N/A"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      
      <div class="section-title">Attendance Record</div>
      <div class="performance-summary">
        <div class="summary-card">
          <div class="summary-label">Attendance %</div>
          <div class="summary-value">${attendance.percentage?.toFixed(2) || "N/A"}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Present Days</div>
          <div class="summary-value">${attendance.presentDays}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Absent Days</div>
          <div class="summary-value">${attendance.absentDays}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Days</div>
          <div class="summary-value">${attendance.totalDays}</div>
        </div>
      </div>
      
      ${strengths.length > 0 || areasForImprovement.length > 0 ? `
        <div class="section-title">Strengths & Areas for Improvement</div>
        <div class="strengths-weaknesses">
          ${strengths.length > 0 ? `
            <div class="list-section">
              <div class="list-title">Strengths</div>
              <ul>
                ${strengths.map(s => `<li>${s}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
          ${areasForImprovement.length > 0 ? `
            <div class="list-section">
              <div class="list-title">Areas for Improvement</div>
              <ul>
                ${areasForImprovement.map(a => `<li>${a}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
        </div>
      ` : ""}
      
      ${teacherRemarks ? `
        <div class="section-title">Teacher's Remarks</div>
        <div class="remarks-section">
          <div class="remarks-text">${teacherRemarks}</div>
        </div>
      ` : ""}
      
      ${principalRemarks ? `
        <div class="section-title">Principal's Remarks</div>
        <div class="remarks-section">
          <div class="remarks-text">${principalRemarks}</div>
        </div>
      ` : ""}
      
      <div class="footer">
        <div class="signature">
          <div class="signature-line">Class Teacher</div>
        </div>
        <div class="signature">
          <div class="signature-line">Principal</div>
        </div>
        <div class="signature">
          <div class="signature-line">Parent/Guardian</div>
        </div>
      </div>
      
      <div class="print-date">
        Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML template for payment receipt
 */
function generateReceiptHTML(data: ReceiptData): string {
  const {
    receiptNumber,
    paymentDate,
    student,
    payment,
    feeStructure,
    feeItems,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          color: #333;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #2563eb;
          padding: 30px;
          border-radius: 8px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        
        .school-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .receipt-title {
          font-size: 20px;
          color: #4b5563;
          margin-top: 10px;
        }
        
        .receipt-number {
          font-size: 14px;
          color: #6b7280;
          margin-top: 5px;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-group {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
        }
        
        .info-title {
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .info-label {
          color: #6b7280;
        }
        
        .info-value {
          color: #1f2937;
          font-weight: 500;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        
        .items-table th {
          background-color: #2563eb;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .amount-cell {
          text-align: right;
        }
        
        .totals-section {
          margin-top: 20px;
          padding: 20px;
          background-color: #eff6ff;
          border-radius: 6px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .total-row.grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
          padding-top: 10px;
          border-top: 2px solid #2563eb;
        }
        
        .payment-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .status-partial {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          width: 200px;
          border-top: 2px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 14px;
          color: #4b5563;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="school-name">School Management System</div>
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-number">Receipt No: ${receiptNumber || "N/A"}</div>
        </div>
        
        <div class="info-section">
          <div class="info-group">
            <div class="info-title">Student Information</div>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${student.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Admission ID:</span>
              <span class="info-value">${student.admissionId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Class:</span>
              <span class="info-value">${student.class} - ${student.section}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${student.email}</span>
            </div>
          </div>
          
          <div class="info-group">
            <div class="info-title">Payment Information</div>
            <div class="info-item">
              <span class="info-label">Date:</span>
              <span class="info-value">${format(new Date(paymentDate), "MMM dd, yyyy")}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Method:</span>
              <span class="info-value">${payment.paymentMethod.replace(/_/g, " ")}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${payment.transactionId || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="payment-status status-${payment.status.toLowerCase()}">${payment.status}</span>
            </div>
          </div>
        </div>
        
        <div class="info-title" style="margin-bottom: 15px;">Fee Details - ${feeStructure.name} (${feeStructure.academicYear})</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th class="amount-cell">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${feeItems.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount-cell">₹${item.amount.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-row">
            <span>Total Amount:</span>
            <span>₹${payment.amount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Amount Paid:</span>
            <span>₹${payment.paidAmount.toFixed(2)}</span>
          </div>
          ${payment.balance > 0 ? `
            <div class="total-row">
              <span>Balance Due:</span>
              <span>₹${payment.balance.toFixed(2)}</span>
            </div>
          ` : ""}
          <div class="total-row grand-total">
            <span>Total Paid:</span>
            <span>₹${payment.paidAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line">Received By</div>
          </div>
          <div class="signature">
            <div class="signature-line">Authorized Signature</div>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p style="margin-top: 10px;">Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}</p>
          <p style="margin-top: 10px;">For any queries, please contact the school office.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML using puppeteer (server-side only)
 * This function should be called from server actions or API routes
 * NOTE: Requires 'puppeteer' package to be installed: npm install puppeteer
 */
export async function generatePDFFromHTML(
  html: string,
  options?: {
    format?: "A4" | "Letter";
    landscape?: boolean;
  }
): Promise<Buffer> {
  throw new Error("PDF generation from HTML requires puppeteer package. Install it with: npm install puppeteer");
  
  // Uncomment below when puppeteer is installed:
  /*
  const puppeteer = await import("puppeteer");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdf = await page.pdf({
      format: options?.format || "A4",
      landscape: options?.landscape || false,
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });
    
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
  */
}

/**
 * Generate report card PDF
 */
export async function generateReportCardPDF(
  data: ProgressReportData
): Promise<Buffer> {
  const html = generateReportCardHTML(data);
  return generatePDFFromHTML(html);
}

/**
 * Generate payment receipt PDF
 */
export async function generateReceiptPDF(
  data: ReceiptData
): Promise<Buffer> {
  const html = generateReceiptHTML(data);
  return generatePDFFromHTML(html);
}

/**
 * Generate report card HTML (for preview)
 */
export function getReportCardHTML(data: ProgressReportData): string {
  return generateReportCardHTML(data);
}

/**
 * Generate receipt HTML (for preview)
 */
export function getReceiptHTML(data: ReceiptData): string {
  return generateReceiptHTML(data);
}
