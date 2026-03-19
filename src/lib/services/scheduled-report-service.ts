import cron from "node-cron";
import { prisma } from "@/lib/db";
import { generateReport, ReportConfig } from "@/lib/actions/reportBuilderActions";
import { updateScheduledReportRunTime } from "@/lib/actions/scheduledReportActions";
import { sendEmail, generateReportEmailTemplate } from "@/lib/utils/email-service";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
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
 * Generate Excel from report data using ExcelJS
 */
async function generateExcel(reportName: string, data: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  if (data.length > 0) {
    // Set columns from first data row
    const columns = Object.keys(data[0]).map(key => ({
      header: key,
      key: key,
      width: 15,
    }));
    worksheet.columns = columns;

    // Add data rows
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
  }

  // Add metadata
  workbook.creator = "SikshaMitra";
  workbook.title = reportName;
  workbook.subject = "Scheduled Report";
  workbook.created = new Date();

  return Buffer.from(await workbook.xlsx.writeBuffer());
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
        fileBuffer = await generateExcel(report.name, result.data);
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
 * SECURITY: Added rate limiting and error handling
 */
async function checkScheduledReports() {
  try {
    const now = new Date();

    // SECURITY: Limit the number of reports processed per run to prevent resource exhaustion
    const MAX_REPORTS_PER_RUN = 10;

    // Find all active reports that are due
    const dueReports = await prisma.scheduledReport.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: now,
        },
      },
      take: MAX_REPORTS_PER_RUN, // SECURITY: Limit batch size
      orderBy: {
        nextRunAt: 'asc', // Process oldest first
      },
    });

    console.log(`Found ${dueReports.length} due scheduled reports`);

    // Execute each report with error isolation
    for (const report of dueReports) {
      try {
        await executeScheduledReport(report.id);
      } catch (error) {
        console.error(`Failed to execute report ${report.id}:`, error);
        // Continue with other reports even if one fails
      }
    }
  } catch (error) {
    console.error("Error checking scheduled reports:", error);
  }
}

/**
 * Initialize scheduled report cron job
 * Optimized polling with intelligent scheduling
 */
export function initializeScheduledReportService() {
  console.log("Initializing scheduled report service...");

  // OPTIMIZED: Run every 5 minutes instead of every minute to reduce database load
  // Most scheduled reports don't need minute-level precision
  cron.schedule("*/5 * * * *", async () => {
    await checkScheduledReports();
  });

  console.log("Scheduled report service initialized with 5-minute intervals");
}

/**
 * Manually trigger a scheduled report (for testing)
 */
export async function triggerScheduledReport(reportId: string) {
  await executeScheduledReport(reportId);
}
