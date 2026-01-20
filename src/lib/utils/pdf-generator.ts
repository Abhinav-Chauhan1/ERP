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
 * Generate HTML template for payment receipt (Indian Format - Compact Single Page)
 */
function generateReceiptHTML(data: ReceiptData): string {
  const {
    receiptNumber,
    paymentDate,
    student,
    payment,
    feeStructure,
    feeItems,
    school,
  } = data;

  // School information with fallbacks
  const schoolName = school?.name || 'School Management System';
  const schoolAddress = school?.address || '';
  const schoolPhone = school?.phone || '';
  const schoolEmail = school?.email || '';
  const schoolLogo = school?.logo || '';

  const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const amountInWords = numberToIndianWords(Math.floor(payment.paidAmount)) + ' Rupees Only';
  const formattedDate = format(new Date(paymentDate), "dd/MM/yyyy");
  const formattedTime = format(new Date(paymentDate), "hh:mm a");
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "hh:mm a");

  // Build contact line
  const contactParts = [];
  if (schoolPhone) contactParts.push(`Ph: ${schoolPhone}`);
  if (schoolEmail) contactParts.push(`Email: ${schoolEmail}`);
  const contactLine = contactParts.join(' | ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fee Receipt - ${receiptNumber}</title>
      <style>
        @page { size: A4; margin: 8mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; line-height: 1.2; }
        .receipt-wrapper { max-width: 210mm; margin: 0 auto; padding: 5px; }
        .receipt-container { border: 2px solid #1e3a5f; padding: 10px; background: #fff; position: relative; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 50px; color: rgba(30,58,95,0.04); font-weight: bold; pointer-events: none; }
        .header { text-align: center; border-bottom: 1px solid #1e3a5f; padding-bottom: 6px; margin-bottom: 6px; }
        .school-name { font-size: 14px; font-weight: bold; color: #1e3a5f; text-transform: uppercase; }
        .school-address { font-size: 8px; color: #4a5568; margin-top: 1px; }
        .school-contact { font-size: 7px; color: #64748b; margin-top: 1px; }
        .receipt-title-box { background: #1e3a5f; color: white; padding: 3px 12px; margin: 4px auto 0; display: inline-block; border-radius: 2px; }
        .receipt-title { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
        .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 6px; padding: 4px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 2px; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-size: 6px; color: #64748b; text-transform: uppercase; font-weight: 600; }
        .meta-value { font-size: 8px; font-weight: bold; color: #1e3a5f; }
        .section-title { background: #1e3a5f; color: white; padding: 2px 6px; font-size: 7px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .student-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px 8px; margin-bottom: 6px; padding: 4px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 2px; }
        .detail-row { display: flex; gap: 3px; }
        .detail-label { font-weight: 600; color: #64748b; font-size: 7px; min-width: 55px; }
        .detail-value { color: #1a1a1a; font-weight: 500; font-size: 8px; }
        .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .fee-table th { background: #1e3a5f; color: white; padding: 3px 6px; text-align: left; font-size: 7px; font-weight: 600; }
        .fee-table th:first-child { width: 25px; text-align: center; }
        .fee-table th:last-child { text-align: right; width: 80px; }
        .fee-table td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; font-size: 8px; }
        .fee-table td:first-child { text-align: center; }
        .fee-table td:last-child { text-align: right; font-weight: 600; font-family: 'Courier New', monospace; }
        .fee-table tr:nth-child(even) { background: #f8fafc; }
        .totals-section { border: 1px solid #1e3a5f; border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
        .total-row { display: flex; justify-content: space-between; padding: 3px 8px; border-bottom: 1px solid #e2e8f0; }
        .total-row:last-child { border-bottom: none; }
        .total-label { font-weight: 600; color: #374151; font-size: 8px; }
        .total-value { font-weight: bold; font-family: 'Courier New', monospace; font-size: 9px; color: #1e3a5f; }
        .grand-total-row { background: #1e3a5f; }
        .grand-total-row .total-label, .grand-total-row .total-value { color: white; font-size: 9px; }
        .amount-words { background: #fef3c7; border: 1px solid #fbbf24; padding: 3px 6px; margin-bottom: 6px; border-radius: 2px; }
        .amount-words-label { font-size: 6px; color: #92400e; font-weight: 600; }
        .amount-words-value { font-size: 8px; font-weight: bold; color: #78350f; font-style: italic; }
        .payment-mode-section { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
        .payment-box { padding: 4px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 2px; }
        .payment-box-title { font-size: 6px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 1px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; }
        .signature-box { text-align: center; min-width: 100px; }
        .signature-line { margin-top: 20px; border-top: 1px solid #1a1a1a; padding-top: 2px; }
        .signature-title { font-size: 7px; font-weight: 600; color: #374151; }
        .stamp-box { width: 50px; height: 50px; border: 1px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 6px; color: #94a3b8; }
        .receipt-footer { margin-top: 6px; padding-top: 4px; border-top: 1px solid #1e3a5f; text-align: center; }
        .footer-note { font-size: 7px; color: #64748b; }
        .footer-note strong { color: #1e3a5f; }
        .print-info { font-size: 6px; color: #94a3b8; margin-top: 2px; }
        .terms-section { margin-top: 4px; padding: 3px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 2px; }
        .terms-title { font-size: 6px; font-weight: bold; color: #991b1b; }
        .terms-list { font-size: 6px; color: #7f1d1d; padding-left: 10px; margin: 0; }
        .terms-list li { margin-bottom: 0; }
        .status-badge { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 7px; font-weight: bold; text-transform: uppercase; }
        .status-completed { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .status-pending { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .status-partial { background: #dbeafe; color: #1e40af; border: 1px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="receipt-wrapper">
        <div class="receipt-container">
          <div class="watermark">${payment.status === 'COMPLETED' ? 'PAID' : 'PENDING'}</div>
          
          <!-- Header -->
          <div class="header">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px;">
              ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;" />` : ''}
              <div>
                <div class="school-name">${schoolName}</div>
                ${schoolAddress ? `<div class="school-address">${schoolAddress}</div>` : ''}
                ${contactLine ? `<div class="school-contact">${contactLine}</div>` : ''}
              </div>
            </div>
            <div class="receipt-title-box">
              <div class="receipt-title">FEE RECEIPT / फीस रसीद</div>
            </div>
          </div>
          
          <!-- Meta Info -->
          <div class="receipt-meta">
            <div class="meta-item">
              <span class="meta-label">Receipt No.</span>
              <span class="meta-value">${receiptNumber || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">${formattedDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Time</span>
              <span class="meta-value">${formattedTime}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Academic Year</span>
              <span class="meta-value">${feeStructure.academicYear}</span>
            </div>
          </div>
          
          <!-- Student Details -->
          <div class="section-title">Student Details</div>
          <div class="student-details">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${student.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Adm. No.:</span>
              <span class="detail-value">${student.admissionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Class:</span>
              <span class="detail-value">${student.class} - ${student.section}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fee Type:</span>
              <span class="detail-value">${feeStructure.name}</span>
            </div>
          </div>
          
          <!-- Fee Table -->
          <div class="section-title">Fee Particulars</div>
          <table class="fee-table">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Particulars</th>
                <th>Amount (₹)</th>
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
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Gross Amount</span>
              <span class="total-value">${formatIndianCurrency(totalAmount)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Amount Paid</span>
              <span class="total-value">${formatIndianCurrency(payment.paidAmount)}</span>
            </div>
            ${payment.balance > 0 ? `
              <div class="total-row">
                <span class="total-label">Balance Due</span>
                <span class="total-value" style="color: #dc2626;">${formatIndianCurrency(payment.balance)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total-row">
              <span class="total-label">Net Amount Received</span>
              <span class="total-value">${formatIndianCurrency(payment.paidAmount)}</span>
            </div>
          </div>
          
          <!-- Amount Words -->
          <div class="amount-words">
            <span class="amount-words-label">In Words: </span>
            <span class="amount-words-value">${amountInWords}</span>
          </div>
          
          <!-- Payment Mode -->
          <div class="payment-mode-section">
            <div class="payment-box">
              <div class="payment-box-title">Payment Mode</div>
              <div class="detail-row">
                <span class="detail-label">Mode:</span>
                <span class="detail-value">${payment.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Txn ID:</span>
                <span class="detail-value">${payment.transactionId || 'N/A'}</span>
              </div>
            </div>
            <div class="payment-box">
              <div class="payment-box-title">Status</div>
              <div style="text-align: center; padding-top: 4px;">
                <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
              </div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-title">Parent/Guardian</div>
              </div>
            </div>
            <div class="stamp-box">Seal</div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-title">Cashier</div>
              </div>
            </div>
          </div>
          
          <!-- Terms -->
          <div class="terms-section">
            <span class="terms-title">Note:</span> Fees once paid are non-refundable. This is a computer-generated receipt.
          </div>
          
          <!-- Footer -->
          <div class="receipt-footer">
            <div class="footer-note"><strong>Thank you!</strong></div>
            <div class="print-info">Generated: ${currentDate} ${currentTime}</div>
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
