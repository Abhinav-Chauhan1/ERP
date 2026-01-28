/**
 * Compliance Reporting and Security Service
 * 
 * Provides compliance report generation, data access pattern logging,
 * and enhanced authentication for sensitive operations.
 * 
 * Requirements: 4.3, 4.4, 4.6
 */

import { db } from "@/lib/db"
import { logAuditEvent, logDataAccess } from "./audit-service"
import { AuditAction } from "@prisma/client"

/**
 * Compliance report types
 */
export enum ComplianceReportType {
  GDPR = "GDPR",
  SOX = "SOX",
  HIPAA = "HIPAA",
  PCI_DSS = "PCI_DSS",
  ISO_27001 = "ISO_27001",
  DATA_ACCESS = "DATA_ACCESS",
  USER_ACTIVITY = "USER_ACTIVITY",
  SECURITY_EVENTS = "SECURITY_EVENTS",
  FINANCIAL_AUDIT = "FINANCIAL_AUDIT"
}

/**
 * Time range for compliance reports
 */
export interface ComplianceTimeRange {
  startDate: Date
  endDate: Date
  timezone?: string
}

/**
 * Compliance report configuration
 */
export interface ComplianceReportConfig {
  reportType: ComplianceReportType
  timeRange: ComplianceTimeRange
  includeDetails?: boolean
  schoolIds?: string[]
  userIds?: string[]
  resources?: string[]
  format?: 'json' | 'pdf' | 'csv'
  metadata?: Record<string, any>
}

/**
 * Compliance report result
 */
export interface ComplianceReport {
  id: string
  reportType: ComplianceReportType
  timeRange: ComplianceTimeRange
  generatedBy: string
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  reportData: ComplianceReportData
  filePath?: string
  createdAt: Date
  metadata?: Record<string, any>
}

/**
 * Compliance report data structure
 */
export interface ComplianceReportData {
  summary: {
    totalEvents: number
    timeRange: ComplianceTimeRange
    reportType: ComplianceReportType
    generatedAt: Date
    generatedBy: string
  }
  sections: ComplianceSection[]
  recommendations?: string[]
  violations?: ComplianceViolation[]
  metadata?: Record<string, any>
}

/**
 * Compliance report section
 */
export interface ComplianceSection {
  title: string
  description: string
  data: any[]
  metrics?: Record<string, number>
  charts?: ComplianceChart[]
}

/**
 * Compliance chart data
 */
export interface ComplianceChart {
  type: 'bar' | 'line' | 'pie' | 'timeline'
  title: string
  data: any[]
  labels?: string[]
}

/**
 * Compliance violation
 */
export interface ComplianceViolation {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  timestamp: Date
  userId?: string
  resourceId?: string
  recommendation: string
}

/**
 * Data access pattern
 */
export interface DataAccessPattern {
  userId: string
  userEmail: string
  resource: string
  resourceId?: string
  accessType: string
  timestamp: Date
  ipAddress?: string
  frequency: number
  riskScore: number
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  description: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

/**
 * Generate compliance report
 * 
 * Requirements: 4.3 - Compliance report generation
 */
export async function generateComplianceReport(
  config: ComplianceReportConfig,
  generatedBy: string
): Promise<ComplianceReport> {
  try {
    // Log the report generation request
    await logAuditEvent({
      userId: generatedBy,
      action: 'CREATE' as AuditAction,
      resource: 'COMPLIANCE_REPORT',
      changes: {
        reportType: config.reportType,
        timeRange: config.timeRange,
        requestedBy: generatedBy
      },
      severity: 'HIGH'
    })

    // Create initial report record
    const reportRecord = await db.complianceReport.create({
      data: {
        reportType: config.reportType,
        timeRange: config.timeRange,
        generatedBy,
        status: 'GENERATING',
        reportData: {
          summary: {
            totalEvents: 0,
            timeRange: config.timeRange,
            reportType: config.reportType,
            generatedAt: new Date(),
            generatedBy
          },
          sections: []
        }
      }
    })

    try {
      // Generate report data based on type
      const reportData = await generateReportData(config, generatedBy)

      // Update report with generated data
      const updatedReport = await db.complianceReport.update({
        where: { id: reportRecord.id },
        data: {
          status: 'COMPLETED',
          reportData
        }
      })

      // Log successful completion
      await logAuditEvent({
        userId: generatedBy,
        action: 'UPDATE' as AuditAction,
        resource: 'COMPLIANCE_REPORT',
        resourceId: reportRecord.id,
        changes: {
          status: 'COMPLETED',
          totalEvents: reportData.summary.totalEvents
        },
        severity: 'HIGH'
      })

      return {
        id: updatedReport.id,
        reportType: config.reportType,
        timeRange: config.timeRange,
        generatedBy,
        status: 'COMPLETED',
        reportData,
        createdAt: updatedReport.createdAt
      }

    } catch (error) {
      // Update report status to failed
      await db.complianceReport.update({
        where: { id: reportRecord.id },
        data: {
          status: 'FAILED',
          reportData: {
            summary: {
              totalEvents: 0,
              timeRange: config.timeRange,
              reportType: config.reportType,
              generatedAt: new Date(),
              generatedBy
            },
            sections: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      throw error
    }

  } catch (error) {
    console.error("Failed to generate compliance report:", error)
    throw new Error("Failed to generate compliance report")
  }
}

/**
 * Generate report data based on compliance type
 */
async function generateReportData(
  config: ComplianceReportConfig,
  generatedBy: string
): Promise<ComplianceReportData> {
  const { reportType, timeRange, schoolIds, userIds, resources } = config

  switch (reportType) {
    case ComplianceReportType.GDPR:
      return await generateGDPRReport(timeRange, schoolIds, userIds)
    
    case ComplianceReportType.DATA_ACCESS:
      return await generateDataAccessReport(timeRange, schoolIds, userIds, resources)
    
    case ComplianceReportType.USER_ACTIVITY:
      return await generateUserActivityReport(timeRange, userIds)
    
    case ComplianceReportType.SECURITY_EVENTS:
      return await generateSecurityEventsReport(timeRange)
    
    case ComplianceReportType.FINANCIAL_AUDIT:
      return await generateFinancialAuditReport(timeRange, schoolIds)
    
    default:
      return await generateGenericComplianceReport(reportType, timeRange)
  }
}

/**
 * Generate GDPR compliance report
 */
async function generateGDPRReport(
  timeRange: ComplianceTimeRange,
  schoolIds?: string[],
  userIds?: string[]
): Promise<ComplianceReportData> {
  // Get data access events
  const dataAccessEvents = await db.auditLog.findMany({
    where: {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      },
      action: {
        in: ['READ', 'EXPORT', 'VIEW']
      },
      ...(userIds && { userId: { in: userIds } })
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  // Analyze data access patterns
  const accessPatterns = analyzeDataAccessPatterns(dataAccessEvents)
  const violations = detectGDPRViolations(dataAccessEvents, accessPatterns)

  return {
    summary: {
      totalEvents: dataAccessEvents.length,
      timeRange,
      reportType: ComplianceReportType.GDPR,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'Data Access Overview',
        description: 'Summary of all data access events during the reporting period',
        data: dataAccessEvents.map(event => ({
          timestamp: event.timestamp,
          user: event.user.email,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          ipAddress: event.ipAddress
        })),
        metrics: {
          totalAccess: dataAccessEvents.length,
          uniqueUsers: new Set(dataAccessEvents.map(e => e.userId)).size,
          uniqueResources: new Set(dataAccessEvents.map(e => e.resource)).size
        }
      },
      {
        title: 'Access Patterns Analysis',
        description: 'Analysis of data access patterns and potential risks',
        data: accessPatterns,
        metrics: {
          highRiskPatterns: accessPatterns.filter(p => p.riskScore > 7).length,
          mediumRiskPatterns: accessPatterns.filter(p => p.riskScore > 4 && p.riskScore <= 7).length
        }
      }
    ],
    violations,
    recommendations: [
      'Review high-risk access patterns for potential policy violations',
      'Implement additional access controls for sensitive resources',
      'Regular training on GDPR compliance for all users'
    ]
  }
}

/**
 * Generate data access report
 */
async function generateDataAccessReport(
  timeRange: ComplianceTimeRange,
  schoolIds?: string[],
  userIds?: string[],
  resources?: string[]
): Promise<ComplianceReportData> {
  const whereClause: any = {
    timestamp: {
      gte: timeRange.startDate,
      lte: timeRange.endDate
    },
    action: {
      in: ['READ', 'EXPORT', 'VIEW', 'DOWNLOAD']
    }
  }

  if (userIds) whereClause.userId = { in: userIds }
  if (resources) whereClause.resource = { in: resources }

  const accessEvents = await db.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  // Group by user and resource
  const userAccessMap = new Map<string, any[]>()
  const resourceAccessMap = new Map<string, any[]>()

  accessEvents.forEach(event => {
    // Group by user
    if (!userAccessMap.has(event.userId)) {
      userAccessMap.set(event.userId, [])
    }
    userAccessMap.get(event.userId)!.push(event)

    // Group by resource
    if (!resourceAccessMap.has(event.resource)) {
      resourceAccessMap.set(event.resource, [])
    }
    resourceAccessMap.get(event.resource)!.push(event)
  })

  return {
    summary: {
      totalEvents: accessEvents.length,
      timeRange,
      reportType: ComplianceReportType.DATA_ACCESS,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'Access by User',
        description: 'Data access events grouped by user',
        data: Array.from(userAccessMap.entries()).map(([userId, events]) => ({
          userId,
          userEmail: events[0].user.email,
          userName: events[0].user.name,
          totalAccess: events.length,
          resources: [...new Set(events.map(e => e.resource))],
          lastAccess: events[0].timestamp
        })),
        metrics: {
          totalUsers: userAccessMap.size,
          avgAccessPerUser: Math.round(accessEvents.length / userAccessMap.size)
        }
      },
      {
        title: 'Access by Resource',
        description: 'Data access events grouped by resource type',
        data: Array.from(resourceAccessMap.entries()).map(([resource, events]) => ({
          resource,
          totalAccess: events.length,
          uniqueUsers: new Set(events.map(e => e.userId)).size,
          lastAccess: events[0].timestamp
        })),
        metrics: {
          totalResources: resourceAccessMap.size,
          avgAccessPerResource: Math.round(accessEvents.length / resourceAccessMap.size)
        }
      }
    ]
  }
}

/**
 * Generate user activity report
 */
async function generateUserActivityReport(
  timeRange: ComplianceTimeRange,
  userIds?: string[]
): Promise<ComplianceReportData> {
  const whereClause: any = {
    timestamp: {
      gte: timeRange.startDate,
      lte: timeRange.endDate
    }
  }

  if (userIds) whereClause.userId = { in: userIds }

  const activities = await db.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  // Analyze activity patterns
  const userActivityMap = new Map<string, any>()
  
  activities.forEach(activity => {
    if (!userActivityMap.has(activity.userId)) {
      userActivityMap.set(activity.userId, {
        user: activity.user,
        activities: [],
        actionCounts: new Map<string, number>(),
        resourceCounts: new Map<string, number>()
      })
    }

    const userActivity = userActivityMap.get(activity.userId)!
    userActivity.activities.push(activity)
    
    // Count actions
    const actionCount = userActivity.actionCounts.get(activity.action) || 0
    userActivity.actionCounts.set(activity.action, actionCount + 1)
    
    // Count resources
    const resourceCount = userActivity.resourceCounts.get(activity.resource) || 0
    userActivity.resourceCounts.set(activity.resource, resourceCount + 1)
  })

  return {
    summary: {
      totalEvents: activities.length,
      timeRange,
      reportType: ComplianceReportType.USER_ACTIVITY,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'User Activity Summary',
        description: 'Summary of user activities during the reporting period',
        data: Array.from(userActivityMap.entries()).map(([userId, data]) => ({
          userId,
          userEmail: data.user.email,
          userName: data.user.name,
          userRole: data.user.role,
          totalActivities: data.activities.length,
          topActions: Array.from(data.actionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          topResources: Array.from(data.resourceCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          lastActivity: data.activities[0].timestamp
        })),
        metrics: {
          totalUsers: userActivityMap.size,
          avgActivitiesPerUser: Math.round(activities.length / userActivityMap.size)
        }
      }
    ]
  }
}

/**
 * Generate security events report
 */
async function generateSecurityEventsReport(
  timeRange: ComplianceTimeRange
): Promise<ComplianceReportData> {
  // Get security-related audit events
  const securityEvents = await db.auditLog.findMany({
    where: {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      },
      OR: [
        { resource: 'AUTH' },
        { action: 'LOGIN' },
        { action: 'LOGOUT' },
        { changes: { path: ['severity'], equals: 'CRITICAL' } }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  // Categorize security events
  const eventCategories = {
    authentication: securityEvents.filter(e => e.resource === 'AUTH' || ['LOGIN', 'LOGOUT'].includes(e.action)),
    critical: securityEvents.filter(e => (e.changes as any)?.severity === 'CRITICAL'),
    failed: securityEvents.filter(e => (e.changes as any)?.success === false)
  }

  return {
    summary: {
      totalEvents: securityEvents.length,
      timeRange,
      reportType: ComplianceReportType.SECURITY_EVENTS,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'Authentication Events',
        description: 'Login, logout, and authentication-related events',
        data: eventCategories.authentication.map(event => ({
          timestamp: event.timestamp,
          user: event.user?.email || 'anonymous',
          action: event.action,
          success: (event.changes as any)?.success,
          ipAddress: event.ipAddress,
          details: event.changes
        })),
        metrics: {
          totalAuth: eventCategories.authentication.length,
          failedAuth: eventCategories.failed.length
        }
      },
      {
        title: 'Critical Security Events',
        description: 'High-severity security events requiring attention',
        data: eventCategories.critical.map(event => ({
          timestamp: event.timestamp,
          user: event.user?.email || 'system',
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          details: event.changes
        })),
        metrics: {
          totalCritical: eventCategories.critical.length
        }
      }
    ],
    violations: eventCategories.failed.map(event => ({
      id: event.id,
      type: 'AUTHENTICATION_FAILURE',
      severity: 'MEDIUM' as const,
      description: `Failed authentication attempt for ${(event.changes as any)?.email || 'unknown user'}`,
      timestamp: event.timestamp,
      userId: event.userId,
      recommendation: 'Monitor for repeated failures and consider IP blocking'
    }))
  }
}

/**
 * Generate financial audit report
 */
async function generateFinancialAuditReport(
  timeRange: ComplianceTimeRange,
  schoolIds?: string[]
): Promise<ComplianceReportData> {
  const whereClause: any = {
    timestamp: {
      gte: timeRange.startDate,
      lte: timeRange.endDate
    },
    resource: {
      in: ['SUBSCRIPTION', 'INVOICE', 'PAYMENT', 'BILLING']
    }
  }

  const financialEvents = await db.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  return {
    summary: {
      totalEvents: financialEvents.length,
      timeRange,
      reportType: ComplianceReportType.FINANCIAL_AUDIT,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'Financial Operations',
        description: 'All financial operations during the reporting period',
        data: financialEvents.map(event => ({
          timestamp: event.timestamp,
          user: event.user.email,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          changes: event.changes
        })),
        metrics: {
          totalOperations: financialEvents.length,
          uniqueUsers: new Set(financialEvents.map(e => e.userId)).size
        }
      }
    ]
  }
}

/**
 * Generate generic compliance report
 */
async function generateGenericComplianceReport(
  reportType: ComplianceReportType,
  timeRange: ComplianceTimeRange
): Promise<ComplianceReportData> {
  const events = await db.auditLog.findMany({
    where: {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 1000 // Limit for generic reports
  })

  return {
    summary: {
      totalEvents: events.length,
      timeRange,
      reportType,
      generatedAt: new Date(),
      generatedBy: 'system'
    },
    sections: [
      {
        title: 'Audit Events',
        description: 'All audit events during the reporting period',
        data: events.map(event => ({
          timestamp: event.timestamp,
          user: event.user.email,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId
        })),
        metrics: {
          totalEvents: events.length
        }
      }
    ]
  }
}

/**
 * Analyze data access patterns for risk assessment
 */
function analyzeDataAccessPatterns(events: any[]): DataAccessPattern[] {
  const patterns = new Map<string, DataAccessPattern>()

  events.forEach(event => {
    const key = `${event.userId}-${event.resource}`
    
    if (!patterns.has(key)) {
      patterns.set(key, {
        userId: event.userId,
        userEmail: event.user.email,
        resource: event.resource,
        resourceId: event.resourceId,
        accessType: event.action,
        timestamp: event.timestamp,
        ipAddress: event.ipAddress,
        frequency: 0,
        riskScore: 0
      })
    }

    const pattern = patterns.get(key)!
    pattern.frequency++
    
    // Calculate risk score based on frequency, time patterns, etc.
    pattern.riskScore = calculateRiskScore(pattern, events.filter(e => e.userId === event.userId))
  })

  return Array.from(patterns.values())
}

/**
 * Calculate risk score for data access pattern
 */
function calculateRiskScore(pattern: DataAccessPattern, userEvents: any[]): number {
  let score = 0

  // High frequency access
  if (pattern.frequency > 100) score += 3
  else if (pattern.frequency > 50) score += 2
  else if (pattern.frequency > 20) score += 1

  // Off-hours access
  const offHoursEvents = userEvents.filter(e => {
    const hour = new Date(e.timestamp).getHours()
    return hour < 6 || hour > 22
  })
  if (offHoursEvents.length > userEvents.length * 0.3) score += 2

  // Multiple IP addresses
  const uniqueIPs = new Set(userEvents.map(e => e.ipAddress).filter(Boolean))
  if (uniqueIPs.size > 5) score += 2
  else if (uniqueIPs.size > 2) score += 1

  // Sensitive resources
  const sensitiveResources = ['USER', 'PAYMENT', 'BILLING', 'SUBSCRIPTION']
  if (sensitiveResources.includes(pattern.resource)) score += 2

  return Math.min(score, 10) // Cap at 10
}

/**
 * Detect GDPR violations
 */
function detectGDPRViolations(events: any[], patterns: DataAccessPattern[]): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []

  // Check for excessive data access
  patterns.forEach(pattern => {
    if (pattern.riskScore > 8) {
      violations.push({
        id: `gdpr-${pattern.userId}-${pattern.resource}`,
        type: 'EXCESSIVE_DATA_ACCESS',
        severity: 'HIGH',
        description: `User ${pattern.userEmail} has excessive access to ${pattern.resource} (${pattern.frequency} times)`,
        timestamp: pattern.timestamp,
        userId: pattern.userId,
        resourceId: pattern.resourceId,
        recommendation: 'Review user permissions and implement additional access controls'
      })
    }
  })

  return violations
}

/**
 * Log data access pattern for compliance monitoring
 * 
 * Requirements: 4.4 - Data access pattern logging
 */
export async function logDataAccessPattern(
  userId: string,
  resource: string,
  resourceId?: string,
  accessType: 'READ' | 'EXPORT' | 'DOWNLOAD' | 'VIEW' = 'READ',
  schoolId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logDataAccess(userId, resource, resourceId, accessType, schoolId)

  // Additional compliance-specific logging
  await logAuditEvent({
    userId,
    action: accessType as AuditAction,
    resource: 'DATA_ACCESS_PATTERN',
    resourceId: `${resource}:${resourceId || 'all'}`,
    changes: {
      dataCategory: resource,
      accessType,
      schoolId,
      complianceRelevant: true,
      ...metadata
    },
    schoolId,
    severity: 'MEDIUM'
  })
}

/**
 * Enhanced authentication check for sensitive operations
 * 
 * Requirements: 4.6 - Enhanced authentication for sensitive operations
 */
export async function requireEnhancedAuth(
  userId: string,
  operation: string,
  resourceType: string,
  resourceId?: string
): Promise<{
  required: boolean
  methods: string[]
  reason: string
}> {
  // Define sensitive operations that require enhanced auth
  const sensitiveOperations = [
    'DELETE_SCHOOL',
    'MODIFY_BILLING',
    'EXPORT_USER_DATA',
    'SYSTEM_CONFIG_CHANGE',
    'BULK_USER_OPERATION',
    'FINANCIAL_REPORT_EXPORT'
  ]

  const sensitiveResources = [
    'SUBSCRIPTION',
    'PAYMENT',
    'BILLING',
    'SYSTEM_CONFIG',
    'USER_DATA_EXPORT'
  ]

  const requiresEnhanced = 
    sensitiveOperations.includes(operation) ||
    sensitiveResources.includes(resourceType)

  if (requiresEnhanced) {
    // Log the enhanced auth requirement
    await logAuditEvent({
      userId,
      action: 'VERIFY' as AuditAction,
      resource: 'ENHANCED_AUTH',
      resourceId: `${operation}:${resourceType}:${resourceId || 'all'}`,
      changes: {
        operation,
        resourceType,
        resourceId,
        authRequired: true,
        reason: 'Sensitive operation requires enhanced authentication'
      },
      severity: 'HIGH'
    })

    return {
      required: true,
      methods: ['MFA', 'PASSWORD_CONFIRM'],
      reason: 'This sensitive operation requires additional authentication'
    }
  }

  return {
    required: false,
    methods: [],
    reason: 'Standard authentication sufficient'
  }
}

/**
 * Get compliance reports with filtering
 */
export async function getComplianceReports(filters: {
  reportType?: ComplianceReportType
  generatedBy?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
} = {}): Promise<{
  reports: ComplianceReport[]
  total: number
  hasMore: boolean
}> {
  const {
    reportType,
    generatedBy,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = filters

  const where: any = {}
  
  if (reportType) where.reportType = reportType
  if (generatedBy) where.generatedBy = generatedBy
  if (status) where.status = status
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const total = await db.complianceReport.count({ where })

  const reports = await db.complianceReport.findMany({
    where,
    include: {
      generatedByUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })

  return {
    reports: reports.map(report => ({
      id: report.id,
      reportType: report.reportType as ComplianceReportType,
      timeRange: report.timeRange as ComplianceTimeRange,
      generatedBy: report.generatedBy,
      status: report.status as any,
      reportData: report.reportData as ComplianceReportData,
      filePath: report.filePath || undefined,
      createdAt: report.createdAt
    })),
    total,
    hasMore: offset + limit < total
  }
}