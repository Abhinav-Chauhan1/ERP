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
 * Convert number to Indian words (for amount in words)
 */
function numberToIndianWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remaining = Math.floor(num % 1000);

  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remaining > 0) result += convertLessThanThousand(remaining);

  return result.trim();
}

/**
 * Format number in Indian currency format (with commas)
 */
function formatIndianCurrency(num: number): string {
  const [intPart, decPart] = num.toFixed(2).split('.');
  const lastThree = intPart.slice(-3);
  const otherDigits = intPart.slice(0, -3);
  const formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherDigits ? ',' : '') + lastThree;
  return `₹${formatted}.${decPart}`;
}

/**
 * Generate HTML template for payment receipt (Indian Format)
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

  const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const amountInWords = numberToIndianWords(Math.floor(payment.paidAmount)) + ' Rupees Only';
  const formattedDate = format(new Date(paymentDate), "dd/MM/yyyy");
  const formattedTime = format(new Date(paymentDate), "hh:mm a");
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "hh:mm a");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fee Receipt - ${receiptNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Noto Sans Devanagari', sans-serif;
          font-size: 12px;
          color: #1a1a1a;
          background: #fff;
          line-height: 1.4;
        }
        
        .receipt-wrapper {
          max-width: 210mm;
          margin: 0 auto;
          padding: 15px;
        }
        
        .receipt-container {
          border: 3px double #1e3a5f;
          padding: 20px;
          background: #fff;
          position: relative;
        }
        
        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 80px;
          color: rgba(30, 58, 95, 0.05);
          font-weight: bold;
          pointer-events: none;
          white-space: nowrap;
        }
        
        /* Header Section */
        .header {
          text-align: center;
          border-bottom: 2px solid #1e3a5f;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        
        .school-logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 8px;
        }
        
        .school-emblem {
          width: 60px;
          height: 60px;
          border: 2px solid #1e3a5f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #1e3a5f;
          font-weight: bold;
        }
        
        .school-info {
          text-align: center;
        }
        
        .school-name-hindi {
          font-size: 16px;
          color: #1e3a5f;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .school-name-english {
          font-size: 22px;
          font-weight: bold;
          color: #1e3a5f;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .school-address {
          font-size: 11px;
          color: #4a5568;
          margin-top: 5px;
        }
        
        .school-contact {
          font-size: 10px;
          color: #4a5568;
          margin-top: 3px;
        }
        
        .receipt-title-section {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
          color: white;
          padding: 8px 20px;
          margin: 10px auto;
          border-radius: 4px;
          display: inline-block;
        }
        
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .receipt-title-hindi {
          font-size: 12px;
          margin-top: 2px;
        }
        
        /* Receipt Meta Info */
        .receipt-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        
        .meta-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .meta-value {
          font-size: 13px;
          font-weight: bold;
          color: #1e3a5f;
        }
        
        /* Student Details Section */
        .section-title {
          background: #1e3a5f;
          color: white;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        
        .student-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .detail-row {
          display: flex;
          gap: 8px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #64748b;
          min-width: 100px;
          font-size: 11px;
        }
        
        .detail-value {
          color: #1a1a1a;
          font-weight: 500;
          font-size: 12px;
        }
        
        /* Fee Details Table */
        .fee-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        .fee-table th {
          background: #1e3a5f;
          color: white;
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .fee-table th:first-child {
          width: 50px;
          text-align: center;
        }
        
        .fee-table th:last-child {
          text-align: right;
          width: 120px;
        }
        
        .fee-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        
        .fee-table td:first-child {
          text-align: center;
          font-weight: 500;
        }
        
        .fee-table td:last-child {
          text-align: right;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        
        .fee-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .fee-table tr:hover {
          background: #eef2ff;
        }
        
        /* Totals Section */
        .totals-section {
          border: 2px solid #1e3a5f;
          border-radius: 4px;
          margin-bottom: 15px;
          overflow: hidden;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .total-row:last-child {
          border-bottom: none;
        }
        
        .total-label {
          font-weight: 600;
          color: #374151;
          font-size: 12px;
        }
        
        .total-value {
          font-weight: bold;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #1e3a5f;
        }
        
        .grand-total-row {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
          color: white;
        }
        
        .grand-total-row .total-label,
        .grand-total-row .total-value {
          color: white;
          font-size: 14px;
        }
        
        /* Amount in Words */
        .amount-words {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 10px 15px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        
        .amount-words-label {
          font-size: 10px;
          color: #92400e;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .amount-words-value {
          font-size: 12px;
          font-weight: bold;
          color: #78350f;
          font-style: italic;
        }
        
        /* Payment Mode Section */
        .payment-mode-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .payment-box {
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .payment-box-title {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px dashed #cbd5e1;
        }
        
        /* Signature Section */
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
        }
        
        .signature-box {
          text-align: center;
          min-width: 150px;
        }
        
        .signature-line {
          margin-top: 40px;
          border-top: 1px solid #1a1a1a;
          padding-top: 5px;
        }
        
        .signature-title {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
        }
        
        .signature-subtitle {
          font-size: 9px;
          color: #64748b;
        }
        
        .stamp-box {
          width: 90px;
          height: 90px;
          border: 2px dashed #cbd5e1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
        }
        
        /* Footer */
        .receipt-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #1e3a5f;
          text-align: center;
        }
        
        .footer-note {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 5px;
        }
        
        .footer-note strong {
          color: #1e3a5f;
        }
        
        .print-info {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 10px;
        }
        
        /* Terms Section */
        .terms-section {
          margin-top: 15px;
          padding: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
        }
        
        .terms-title {
          font-size: 10px;
          font-weight: bold;
          color: #991b1b;
          margin-bottom: 5px;
        }
        
        .terms-list {
          font-size: 9px;
          color: #7f1d1d;
          padding-left: 15px;
        }
        
        .terms-list li {
          margin-bottom: 2px;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-completed {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        
        .status-partial {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #3b82f6;
        }
        
        /* Print Styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .receipt-wrapper {
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-wrapper">
        <div class="receipt-container">
          <!-- Watermark -->
          <div class="watermark">${payment.status === 'COMPLETED' ? 'PAID' : 'PENDING'}</div>
          
          <!-- Header -->
          <div class="header">
            <div class="school-logo-section">
              <div class="school-emblem">🏫</div>
              <div class="school-info">
                <div class="school-name-hindi">विद्यालय प्रबंधन प्रणाली</div>
                <div class="school-name-english">School Management System</div>
                <div class="school-address">123 Education Street, Knowledge City - 123456</div>
                <div class="school-contact">Phone: +91-XXXX-XXXXXX | Email: info@school.edu.in | GSTIN: XXXXXXXXXXXX</div>
              </div>
            </div>
            <div class="receipt-title-section">
              <div class="receipt-title">Fee Receipt / फीस रसीद</div>
            </div>
          </div>
          
          <!-- Receipt Meta Information -->
          <div class="receipt-meta">
            <div class="meta-item">
              <span class="meta-label">Receipt No. / रसीद संख्या</span>
              <span class="meta-value">${receiptNumber || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date / दिनांक</span>
              <span class="meta-value">${formattedDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Time / समय</span>
              <span class="meta-value">${formattedTime}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Academic Year / शैक्षणिक वर्ष</span>
              <span class="meta-value">${feeStructure.academicYear}</span>
            </div>
          </div>
          
          <!-- Student Details -->
          <div class="section-title">Student Details / विद्यार्थी विवरण</div>
          <div class="student-details">
            <div class="detail-row">
              <span class="detail-label">Name / नाम:</span>
              <span class="detail-value">${student.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Admission No.:</span>
              <span class="detail-value">${student.admissionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Class / कक्षा:</span>
              <span class="detail-value">${student.class}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Section / अनुभाग:</span>
              <span class="detail-value">${student.section}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fee Structure:</span>
              <span class="detail-value">${feeStructure.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email / ईमेल:</span>
              <span class="detail-value">${student.email}</span>
            </div>
          </div>
          
          <!-- Fee Details Table -->
          <div class="section-title">Fee Particulars / शुल्क विवरण</div>
          <table class="fee-table">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Particulars / विवरण</th>
                <th>Amount / राशि (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${feeItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${formatIndianCurrency(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Gross Amount / कुल राशि</span>
              <span class="total-value">${formatIndianCurrency(totalAmount)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Amount Paid / भुगतान राशि</span>
              <span class="total-value">${formatIndianCurrency(payment.paidAmount)}</span>
            </div>
            ${payment.balance > 0 ? `
              <div class="total-row">
                <span class="total-label">Balance Due / शेष राशि</span>
                <span class="total-value" style="color: #dc2626;">${formatIndianCurrency(payment.balance)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total-row">
              <span class="total-label">Net Amount Received / प्राप्त राशि</span>
              <span class="total-value">${formatIndianCurrency(payment.paidAmount)}</span>
            </div>
          </div>
          
          <!-- Amount in Words -->
          <div class="amount-words">
            <div class="amount-words-label">Amount in Words / शब्दों में राशि:</div>
            <div class="amount-words-value">${amountInWords}</div>
          </div>
          
          <!-- Payment Mode Section -->
          <div class="payment-mode-section">
            <div class="payment-box">
              <div class="payment-box-title">Payment Mode / भुगतान माध्यम</div>
              <div class="detail-row">
                <span class="detail-label">Mode:</span>
                <span class="detail-value">${payment.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${payment.transactionId || 'N/A'}</span>
              </div>
            </div>
            <div class="payment-box">
              <div class="payment-box-title">Payment Status / भुगतान स्थिति</div>
              <div style="text-align: center; padding-top: 10px;">
                <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
              </div>
            </div>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-title">Parent/Guardian</div>
                <div class="signature-subtitle">अभिभावक हस्ताक्षर</div>
              </div>
            </div>
            <div class="stamp-box">
              School<br/>Seal/Stamp<br/>मुहर
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-title">Cashier/Accountant</div>
                <div class="signature-subtitle">कैशियर/लेखाकार</div>
              </div>
            </div>
          </div>
          
          <!-- Terms & Conditions -->
          <div class="terms-section">
            <div class="terms-title">Terms & Conditions / नियम एवं शर्तें:</div>
            <ol class="terms-list">
              <li>Fees once paid will not be refunded under any circumstances.</li>
              <li>Please keep this receipt safe for future reference.</li>
              <li>This is a computer-generated receipt and does not require a physical signature.</li>
              <li>For any discrepancy, please contact the accounts department within 7 days.</li>
            </ol>
          </div>
          
          <!-- Footer -->
          <div class="receipt-footer">
            <div class="footer-note">
              <strong>Thank you for your payment! / भुगतान के लिए धन्यवाद!</strong>
            </div>
            <div class="footer-note">
              For queries, contact: accounts@school.edu.in | Helpline: 1800-XXX-XXXX
            </div>
            <div class="print-info">
              Receipt generated on: ${currentDate} at ${currentTime} | This is a computer-generated document
            </div>
          </div>
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
