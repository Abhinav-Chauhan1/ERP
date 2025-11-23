import cron from "node-cron";
import { prisma } from "@/lib/db";
import { generateReport, ReportConfig } from "@/lib/actions/reportBuilderActions";
import { updateScheduledReportRunTime } from "@/lib/actions/scheduledReportActions";
import { sendEmail, generateReportEmailTemplate } from "@/lib/utils/email-service";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate PDF from report data
 */
function generatePDF(reportName: string, data: any[]): Buffer {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(reportName, 14, 15);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
  
  if (data.length === 0) {
    doc.text("No data available", 14, 35);
  } else {
    // Extract headers from first row
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]));
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate Excel from report data
 */
function generateExcel(reportName: string, data: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  
  // Add metadata
  workbook.Props = {
    Title: reportName,
    Subject: "Scheduled Report",
    Author: "School ERP",
    CreatedDate: new Date(),
  };
  
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Generate CSV from report data
 */
function generateCSV(data: any[]): Buffer {
  if (data.length === 0) {
    return Buffer.from("No data available");
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(","));
  }
  
  return Buffer.from(csvRows.join("\n"));
}

/**
 * Execute a scheduled report
 */
async function executeScheduledReport(reportId: string) {
  try {
    console.log(`Executing scheduled report: ${reportId}`);
    
    // Fetch report configuration
    const report = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
    });
    
    if (!report || !report.active) {
      console.log(`Report ${reportId} not found or inactive`);
      return;
    }
    
    // Parse configuration
    const config: ReportConfig = {
      name: report.name,
      dataSource: report.dataSource,
      selectedFields: JSON.parse(report.selectedFields),
      filters: JSON.parse(report.filters),
      sorting: JSON.parse(report.sorting),
    };
    
    // Generate report data
    const result = await generateReport(config);
    
    if (!result.success || !result.data) {
      console.error(`Failed to generate report ${reportId}:`, result.error);
      return;
    }
    
    // Generate file based on format
    let fileBuffer: Buffer;
    let filename: string;
    let mimeType: string;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    switch (report.exportFormat) {
      case "pdf":
        fileBuffer = generatePDF(report.name, result.data);
        filename = `${report.name.replace(/\s+/g, "_")}_${timestamp}.pdf`;
        mimeType = "application/pdf";
        break;
      case "excel":
        fileBuffer = generateExcel(report.name, result.data);
        filename = `${report.name.replace(/\s+/g, "_")}_${timestamp}.xlsx`;
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "csv":
        fileBuffer = generateCSV(result.data);
        filename = `${report.name.replace(/\s+/g, "_")}_${timestamp}.csv`;
        mimeType = "text/csv";
        break;
      default:
        console.error(`Unknown export format: ${report.exportFormat}`);
        return;
    }
    
    // Parse recipients
    const recipients = JSON.parse(report.recipients);
    
    // Generate email content
    const emailHtml = generateReportEmailTemplate(
      report.name,
      report.description ?? undefined,
      new Date()
    );
    
    // Send email with attachment
    const emailResult = await sendEmail({
      to: recipients,
      subject: `Scheduled Report: ${report.name}`,
      html: emailHtml,
      attachments: [
        {
          filename,
          content: fileBuffer,
        },
      ],
    });
    
    if (emailResult.success) {
      console.log(`Successfully sent report ${reportId} to ${recipients.length} recipients`);
    } else {
      console.error(`Failed to send report ${reportId}:`, emailResult.error);
    }
    
    // Update last run time and calculate next run time
    await updateScheduledReportRunTime(reportId);
    
  } catch (error) {
    console.error(`Error executing scheduled report ${reportId}:`, error);
  }
}

/**
 * Check and execute due scheduled reports
 */
async function checkScheduledReports() {
  try {
    const now = new Date();
    
    // Find all active reports that are due
    const dueReports = await prisma.scheduledReport.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: now,
        },
      },
    });
    
    console.log(`Found ${dueReports.length} due scheduled reports`);
    
    // Execute each report
    for (const report of dueReports) {
      await executeScheduledReport(report.id);
    }
  } catch (error) {
    console.error("Error checking scheduled reports:", error);
  }
}

/**
 * Initialize scheduled report cron job
 * Runs every minute to check for due reports
 */
export function initializeScheduledReportService() {
  console.log("Initializing scheduled report service...");
  
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await checkScheduledReports();
  });
  
  console.log("Scheduled report service initialized");
}

/**
 * Manually trigger a scheduled report (for testing)
 */
export async function triggerScheduledReport(reportId: string) {
  await executeScheduledReport(reportId);
}
