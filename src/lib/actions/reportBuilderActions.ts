"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface ReportConfig {
  name: string;
  dataSource: string;
  selectedFields: string[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  chartConfig?: ChartConfig;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

export interface ReportSort {
  field: string;
  direction: "asc" | "desc";
}

export interface ChartConfig {
  enabled: boolean;
  type: "bar" | "line" | "pie" | "area";
  xAxisField: string;
  yAxisField: string;
  aggregation?: "sum" | "average" | "count" | "min" | "max";
  groupBy?: string;
}

export interface ComparativeAnalysisConfig {
  comparisonType: "year-over-year" | "term-over-term";
  dataSource: string;
  metric: string; // The field to compare (e.g., "attendance", "marks", "fees")
  aggregation: "sum" | "average" | "count";
  currentPeriodId: string; // Current academic year or term ID
  previousPeriodId?: string; // Previous academic year or term ID (optional, will auto-detect if not provided)
  filters?: ReportFilter[];
}

export interface ComparisonResult {
  currentPeriod: {
    id: string;
    name: string;
    value: number;
    data: any[];
  };
  previousPeriod: {
    id: string;
    name: string;
    value: number;
    data: any[];
  };
  change: {
    absolute: number;
    percentage: number;
    trend: "up" | "down" | "stable";
  };
  chartData: Array<{
    period: string;
    current: number;
    previous: number;
  }>;
}

/**
 * Generate report data based on configuration
 */
export async function generateReport(config: ReportConfig) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate configuration
    if (!config.dataSource || config.selectedFields.length === 0) {
      return { success: false, error: "Invalid report configuration" };
    }

    // Build query based on data source
    let data: any[] = [];

    switch (config.dataSource) {
      case "students":
        data = await queryStudents(config);
        break;
      case "teachers":
        data = await queryTeachers(config);
        break;
      case "attendance":
        data = await queryAttendance(config);
        break;
      case "fees":
        data = await queryFees(config);
        break;
      case "exams":
        data = await queryExams(config);
        break;
      case "classes":
        data = await queryClasses(config);
        break;
      case "assignments":
        data = await queryAssignments(config);
        break;
      default:
        return { success: false, error: "Invalid data source" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error generating report:", error);
    return { success: false, error: "Failed to generate report" };
  }
}

/**
 * Query students based on configuration
 */
async function queryStudents(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const students = await prisma.student.findMany({
    where,
    orderBy,
    include: {
      user: true,
      enrollments: {
        include: {
          class: true,
          section: true,
        },
      },
    },
  });

  return students.map((student) => {
    const enrollment = student.enrollments[0];
    return {
      id: student.id,
      admissionId: student.admissionId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      class: enrollment?.class.name || "N/A",
      section: enrollment?.section?.name || "N/A",
      rollNumber: student.rollNumber || "N/A",
      dateOfBirth: student.dateOfBirth.toLocaleDateString(),
      gender: student.gender,
      address: student.address || "N/A",
      phone: student.phone || "N/A",
    };
  });
}

/**
 * Query teachers based on configuration
 */
async function queryTeachers(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const teachers = await prisma.teacher.findMany({
    where,
    orderBy,
    include: {
      user: true,
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  });

  return teachers.map((teacher) => ({
    id: teacher.id,
    employeeId: teacher.employeeId,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    email: teacher.user.email,
    qualification: teacher.qualification || "N/A",
    joinDate: teacher.joinDate.toLocaleDateString(),
    salary: teacher.salary?.toString() || "N/A",
    subjects: teacher.subjects.map((s) => s.subject.name).join(", ") || "N/A",
  }));
}

/**
 * Query attendance based on configuration
 */
async function queryAttendance(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const attendance = await prisma.studentAttendance.findMany({
    where,
    orderBy,
    include: {
      student: {
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
              section: true,
            },
          },
        },
      },
    },
    take: 1000, // Limit for performance
  });

  return attendance.map((record: any) => {
    const enrollment = record.student.enrollments[0];
    return {
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
      date: record.date.toLocaleDateString(),
      status: record.status,
      class: enrollment?.class.name || "N/A",
      section: enrollment?.section?.name || "N/A",
      remarks: record.remarks || "N/A",
    };
  });
}

/**
 * Query fee payments based on configuration
 */
async function queryFees(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const payments = await prisma.feePayment.findMany({
    where,
    orderBy,
    include: {
      student: {
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
            },
          },
        },
      },
    },
    take: 1000,
  });

  return payments.map((payment: any) => {
    const enrollment = payment.student.enrollments[0];
    return {
      id: payment.id,
      studentId: payment.studentId,
      studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate.toLocaleDateString(),
      status: payment.status,
      method: payment.method,
      class: enrollment?.class.name || "N/A",
    };
  });
}

/**
 * Query exam results based on configuration
 */
async function queryExams(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const results = await prisma.examResult.findMany({
    where,
    orderBy,
    include: {
      student: {
        include: {
          user: true,
        },
      },
      exam: {
        include: {
          subject: true,
        },
      },
    },
    take: 1000,
  });

  return results.map((result) => {
    const percentage = (result.marks / result.exam.totalMarks) * 100;
    return {
      id: result.id,
      studentId: result.studentId,
      studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
      examName: result.exam.title,
      subject: result.exam.subject.name,
      marks: result.marks.toString(),
      totalMarks: result.exam.totalMarks.toString(),
      percentage: `${percentage.toFixed(2)}%`,
      grade: result.grade || "N/A",
    };
  });
}

/**
 * Query classes based on configuration
 */
async function queryClasses(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const classes = await prisma.class.findMany({
    where,
    orderBy,
    include: {
      sections: {
        include: {
          enrollments: true,
        },
      },
      teachers: {
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    section: cls.sections.map((s) => s.name).join(", ") || "N/A",
    teacher: cls.teachers[0]
      ? `${cls.teachers[0].teacher.user.firstName} ${cls.teachers[0].teacher.user.lastName}`
      : "N/A",
    studentCount: cls.sections
      .reduce((sum, section) => sum + section.enrollments.length, 0)
      .toString(),
  }));
}

/**
 * Query assignments based on configuration
 */
async function queryAssignments(config: ReportConfig) {
  const where = buildWhereClause(config.filters);
  const orderBy = buildOrderByClause(config.sorting);

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy,
    include: {
      subject: true,
      classes: {
        include: {
          class: true,
        },
      },
      creator: {
        include: {
          user: true,
        },
      },
      submissions: true,
    },
    take: 1000,
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    subject: assignment.subject.name,
    class: assignment.classes.map(c => c.class.name).join(", ") || "N/A",
    dueDate: assignment.dueDate.toLocaleDateString(),
    status: new Date() > assignment.dueDate ? "Overdue" : "Active",
    submissionCount: assignment.submissions.length.toString(),
    teacher: assignment.creator ? `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}` : "N/A",
  }));
}

/**
 * Build WHERE clause from filters
 */
function buildWhereClause(filters: ReportFilter[]): any {
  const where: any = {};

  filters.forEach((filter) => {
    if (!filter.field || !filter.value) return;

    switch (filter.operator) {
      case "equals":
        where[filter.field] = filter.value;
        break;
      case "notEquals":
        where[filter.field] = { not: filter.value };
        break;
      case "contains":
        where[filter.field] = { contains: filter.value, mode: "insensitive" };
        break;
      case "greaterThan":
        where[filter.field] = { gt: parseValue(filter.value) };
        break;
      case "lessThan":
        where[filter.field] = { lt: parseValue(filter.value) };
        break;
    }
  });

  return where;
}

/**
 * Build ORDER BY clause from sorting
 */
function buildOrderByClause(sorting: ReportSort[]): any {
  if (sorting.length === 0) return undefined;

  return sorting.map((sort) => ({
    [sort.field]: sort.direction,
  }));
}

/**
 * Parse value to appropriate type
 */
function parseValue(value: string): any {
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num)) return num;

  // Try to parse as date
  const date = new Date(value);
  if (!isNaN(date.getTime())) return date;

  // Return as string
  return value;
}

/**
 * Save report configuration
 */
export async function saveReportConfig(config: ReportConfig) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // TODO: Implement saving report configuration to database
    // This requires a new model 'SavedReportConfig' in the schema which is currently referenced in future requirements.
    // For now, we simulate success to allow UI testing.
    console.log("Saving report config (Simulation):", config);

    revalidatePath("/admin/reports");
    return { success: true, message: "Report configuration saved successfully" };
  } catch (error) {
    console.error("Error saving report config:", error);
    return { success: false, error: "Failed to save report configuration" };
  }
}

/**
 * Process data for chart visualization
 */
export async function processChartData(data: any[], chartConfig: ChartConfig) {
  if (!chartConfig.enabled || !data || data.length === 0) {
    return [];
  }

  const { xAxisField, yAxisField, aggregation, groupBy } = chartConfig;

  // If no grouping, return data as-is with proper field mapping
  if (!groupBy || !aggregation) {
    return data.map(item => ({
      [xAxisField]: item[xAxisField],
      [yAxisField]: parseFloat(item[yAxisField]) || 0,
    }));
  }

  // Group data and apply aggregation
  const grouped = data.reduce((acc, item) => {
    const groupKey = item[groupBy];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Apply aggregation function
  return Object.entries(grouped).map(([key, items]) => {
    let value = 0;
    const itemsArray = items as any[];
    const values = itemsArray.map(item => parseFloat(item[yAxisField]) || 0);

    switch (aggregation) {
      case "sum":
        value = values.reduce((sum, val) => sum + val, 0);
        break;
      case "average":
        value = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case "count":
        value = itemsArray.length;
        break;
      case "min":
        value = Math.min(...values);
        break;
      case "max":
        value = Math.max(...values);
        break;
      default:
        value = values.reduce((sum, val) => sum + val, 0);
    }

    return {
      [xAxisField]: key,
      [yAxisField]: value,
    };
  });
}

/**
 * Export report data in specified format
 * This is a server action that prepares data for client-side export
 */
export async function exportReportData(
  config: ReportConfig,
  format: 'pdf' | 'excel' | 'csv'
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate report data
    const result = await generateReport(config);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || "Failed to generate report data" };
    }

    // Return data for client-side export
    return {
      success: true,
      data: result.data,
      format,
      config: {
        filename: `${config.name.replace(/\s+/g, '_')}_${Date.now()}`,
        title: config.name,
        subtitle: `Data Source: ${config.dataSource}`,
        includeTimestamp: true,
      },
    };
  } catch (error) {
    console.error("Error exporting report:", error);
    return { success: false, error: "Failed to export report" };
  }
}

/**
 * Generate year-over-year comparative analysis
 */
export async function generateYearOverYearComparison(
  config: ComparativeAnalysisConfig
): Promise<{ success: boolean; data?: ComparisonResult; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current academic year
    const currentYear = await prisma.academicYear.findUnique({
      where: { id: config.currentPeriodId },
    });

    if (!currentYear) {
      return { success: false, error: "Current academic year not found" };
    }

    // Get previous academic year (either specified or auto-detect)
    let previousYear;
    if (config.previousPeriodId) {
      previousYear = await prisma.academicYear.findUnique({
        where: { id: config.previousPeriodId },
      });
    } else {
      // Auto-detect previous year by finding the year that ended before current year started
      previousYear = await prisma.academicYear.findFirst({
        where: {
          endDate: { lt: currentYear.startDate },
        },
        orderBy: { endDate: "desc" },
      });
    }

    if (!previousYear) {
      return { success: false, error: "Previous academic year not found" };
    }

    // Fetch data for both periods
    const currentData = await fetchPeriodData(
      config.dataSource,
      config.metric,
      currentYear.startDate,
      currentYear.endDate,
      config.filters || []
    );

    const previousData = await fetchPeriodData(
      config.dataSource,
      config.metric,
      previousYear.startDate,
      previousYear.endDate,
      config.filters || []
    );

    // Calculate aggregated values
    const currentValue = aggregateData(currentData, config.metric, config.aggregation);
    const previousValue = aggregateData(previousData, config.metric, config.aggregation);

    // Calculate change
    const absoluteChange = currentValue - previousValue;
    const percentageChange = previousValue !== 0
      ? (absoluteChange / previousValue) * 100
      : 0;
    const trend = absoluteChange > 0.5 ? "up" : absoluteChange < -0.5 ? "down" : "stable";

    // Prepare chart data for visualization
    const chartData = prepareComparisonChartData(
      currentData,
      previousData,
      config.metric,
      currentYear.name,
      previousYear.name
    );

    const result: ComparisonResult = {
      currentPeriod: {
        id: currentYear.id,
        name: currentYear.name,
        value: currentValue,
        data: currentData,
      },
      previousPeriod: {
        id: previousYear.id,
        name: previousYear.name,
        value: previousValue,
        data: previousData,
      },
      change: {
        absolute: absoluteChange,
        percentage: percentageChange,
        trend,
      },
      chartData,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating year-over-year comparison:", error);
    return { success: false, error: "Failed to generate year-over-year comparison" };
  }
}

/**
 * Generate term-over-term comparative analysis
 */
export async function generateTermOverTermComparison(
  config: ComparativeAnalysisConfig
): Promise<{ success: boolean; data?: ComparisonResult; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current term
    const currentTerm = await prisma.term.findUnique({
      where: { id: config.currentPeriodId },
      include: { academicYear: true },
    });

    if (!currentTerm) {
      return { success: false, error: "Current term not found" };
    }

    // Get previous term (either specified or auto-detect)
    let previousTerm;
    if (config.previousPeriodId) {
      previousTerm = await prisma.term.findUnique({
        where: { id: config.previousPeriodId },
        include: { academicYear: true },
      });
    } else {
      // Auto-detect previous term
      // First try to find previous term in same academic year
      previousTerm = await prisma.term.findFirst({
        where: {
          academicYearId: currentTerm.academicYearId,
          endDate: { lt: currentTerm.startDate },
        },
        orderBy: { endDate: "desc" },
        include: { academicYear: true },
      });

      // If not found, get last term from previous academic year
      if (!previousTerm) {
        const previousYear = await prisma.academicYear.findFirst({
          where: {
            endDate: { lt: currentTerm.academicYear.startDate },
          },
          orderBy: { endDate: "desc" },
        });

        if (previousYear) {
          previousTerm = await prisma.term.findFirst({
            where: { academicYearId: previousYear.id },
            orderBy: { endDate: "desc" },
            include: { academicYear: true },
          });
        }
      }
    }

    if (!previousTerm) {
      return { success: false, error: "Previous term not found" };
    }

    // Fetch data for both periods
    const currentData = await fetchPeriodData(
      config.dataSource,
      config.metric,
      currentTerm.startDate,
      currentTerm.endDate,
      config.filters || []
    );

    const previousData = await fetchPeriodData(
      config.dataSource,
      config.metric,
      previousTerm.startDate,
      previousTerm.endDate,
      config.filters || []
    );

    // Calculate aggregated values
    const currentValue = aggregateData(currentData, config.metric, config.aggregation);
    const previousValue = aggregateData(previousData, config.metric, config.aggregation);

    // Calculate change
    const absoluteChange = currentValue - previousValue;
    const percentageChange = previousValue !== 0
      ? (absoluteChange / previousValue) * 100
      : 0;
    const trend = absoluteChange > 0.5 ? "up" : absoluteChange < -0.5 ? "down" : "stable";

    // Prepare chart data for visualization
    const chartData = prepareComparisonChartData(
      currentData,
      previousData,
      config.metric,
      currentTerm.name,
      previousTerm.name
    );

    const result: ComparisonResult = {
      currentPeriod: {
        id: currentTerm.id,
        name: `${currentTerm.name} (${currentTerm.academicYear.name})`,
        value: currentValue,
        data: currentData,
      },
      previousPeriod: {
        id: previousTerm.id,
        name: `${previousTerm.name} (${previousTerm.academicYear.name})`,
        value: previousValue,
        data: previousData,
      },
      change: {
        absolute: absoluteChange,
        percentage: percentageChange,
        trend,
      },
      chartData,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating term-over-term comparison:", error);
    return { success: false, error: "Failed to generate term-over-term comparison" };
  }
}

/**
 * Fetch data for a specific period
 */
async function fetchPeriodData(
  dataSource: string,
  metric: string,
  startDate: Date,
  endDate: Date,
  filters: ReportFilter[]
): Promise<any[]> {
  const dateFilter = {
    gte: startDate,
    lte: endDate,
  };

  const where = buildWhereClause(filters);

  switch (dataSource) {
    case "attendance":
      return await prisma.studentAttendance.findMany({
        where: {
          ...where,
          date: dateFilter,
        },
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                include: {
                  class: true,
                  section: true,
                },
              },
            },
          },
        },
      });

    case "fees":
      return await prisma.feePayment.findMany({
        where: {
          ...where,
          paymentDate: dateFilter,
        },
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                include: {
                  class: true,
                },
              },
            },
          },
        },
      });

    case "exams":
      return await prisma.examResult.findMany({
        where: {
          ...where,
          createdAt: dateFilter,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          exam: {
            include: {
              subject: true,
            },
          },
        },
      });

    case "students":
      return await prisma.student.findMany({
        where: {
          ...where,
          admissionDate: dateFilter,
        },
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
              section: true,
            },
          },
        },
      });

    default:
      return [];
  }
}

/**
 * Aggregate data based on metric and aggregation type
 */
function aggregateData(data: any[], metric: string, aggregation: string): number {
  if (data.length === 0) return 0;

  let values: number[] = [];

  // Extract metric values based on data source
  switch (metric) {
    case "attendance":
      values = data.map((record) => (record.status === "PRESENT" ? 1 : 0));
      break;
    case "amount":
      values = data.map((record) => parseFloat(record.amount) || 0);
      break;
    case "marks":
      values = data.map((record) => parseFloat(record.marks) || 0);
      break;
    case "percentage":
      values = data.map((record) => {
        if (record.marks && record.exam?.totalMarks) {
          return (record.marks / record.exam.totalMarks) * 100;
        }
        return 0;
      });
      break;
    case "count":
      values = data.map(() => 1);
      break;
    default:
      values = data.map(() => 1);
  }

  // Apply aggregation
  switch (aggregation) {
    case "sum":
      return values.reduce((sum, val) => sum + val, 0);
    case "average":
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    case "count":
      return values.length;
    default:
      return values.reduce((sum, val) => sum + val, 0);
  }
}

/**
 * Prepare chart data for comparison visualization
 */
function prepareComparisonChartData(
  currentData: any[],
  previousData: any[],
  metric: string,
  currentLabel: string,
  previousLabel: string
): Array<{ period: string; current: number; previous: number }> {
  // Group data by month for time-series comparison
  const currentByMonth = groupDataByMonth(currentData, metric);
  const previousByMonth = groupDataByMonth(previousData, metric);

  // Get all unique months
  const allMonths = new Set([
    ...Object.keys(currentByMonth),
    ...Object.keys(previousByMonth),
  ]);

  // Create chart data
  return Array.from(allMonths)
    .sort()
    .map((month) => ({
      period: month,
      current: currentByMonth[month] || 0,
      previous: previousByMonth[month] || 0,
    }));
}

/**
 * Group data by month
 */
function groupDataByMonth(data: any[], metric: string): Record<string, number> {
  const grouped: Record<string, any[]> = {};

  data.forEach((record) => {
    // Determine date field based on data type
    let date: Date;
    if (record.date) {
      date = new Date(record.date);
    } else if (record.paymentDate) {
      date = new Date(record.paymentDate);
    } else if (record.createdAt) {
      date = new Date(record.createdAt);
    } else if (record.admissionDate) {
      date = new Date(record.admissionDate);
    } else {
      return;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(record);
  });

  // Aggregate each month's data
  const result: Record<string, number> = {};
  Object.entries(grouped).forEach(([month, records]) => {
    result[month] = aggregateData(records, metric, "average");
  });

  return result;
}

/**
 * Get available academic years for comparison
 */
export async function getAvailableAcademicYears() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    });

    return { success: true, data: years };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { success: false, error: "Failed to fetch academic years" };
  }
}

/**
 * Get available terms for comparison
 */
export async function getAvailableTerms(academicYearId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const where = academicYearId ? { academicYearId } : {};

    const terms = await prisma.term.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: terms };
  } catch (error) {
    console.error("Error fetching terms:", error);
    return { success: false, error: "Failed to fetch terms" };
  }
}
