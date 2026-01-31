/**
 * Comprehensive Audit Service
 * 
 * Provides comprehensive audit logging for all super-admin actions and system events.
 * This service ensures complete audit trails for compliance and security monitoring.
 * 
 * Requirements: 4.1, 4.2, 4.5
 */

import { db } from "@/lib/db"
import { AuditAction, Prisma } from "@prisma/client"

// Re-export AuditAction for other modules
export { AuditAction } from "@prisma/client"

/**
 * Get headers safely - only works in server components/API routes
 */
async function getHeadersSafely() {
  try {
    // Dynamic import to avoid issues in middleware/client components
    const { headers } = await import("next/headers");
    return await headers();
  } catch (error) {
    // Return null if headers are not available (middleware, client components, etc.)
    return null;
  }
}

/**
 * Audit severity levels enum for type safety
 */
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Audit service configuration
 */
export interface AuditServiceConfig {
  enableConsoleLogging: boolean
  enableCriticalEventLogging: boolean
  defaultSeverity: AuditSeverity
  maxExportLimit: number
  checksumAlgorithm: 'sha256' | 'sha512'
  batchSize: number
  cacheTimeout: number
}

/**
 * Constants for audit service
 */
const AUDIT_CONSTANTS = {
  DEFAULT_LIMIT: 50,
  MAX_EXPORT_LIMIT: 10000,
  BATCH_SIZE: 10,
  CACHE_TTL: 5000,
  DEFAULT_SEVERITY: AuditSeverity.MEDIUM,
  UNKNOWN_VALUE: 'unknown',
  ERROR_LOG_CHECKSUM: 'error-log'
} as const

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AuditServiceConfig = {
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableCriticalEventLogging: true,
  defaultSeverity: AuditSeverity.MEDIUM,
  maxExportLimit: AUDIT_CONSTANTS.MAX_EXPORT_LIMIT,
  checksumAlgorithm: 'sha256',
  batchSize: AUDIT_CONSTANTS.BATCH_SIZE,
  cacheTimeout: AUDIT_CONSTANTS.CACHE_TTL
}

/**
 * Audit event context for comprehensive logging
 */
export interface AuditContext {
  userId: string | null
  action: AuditAction
  resource: string
  resourceId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  schoolId?: string
  severity?: AuditSeverity
  details?: Record<string, any>
}

/**
 * Enriched audit context with computed fields
 */
interface EnrichedAuditContext extends AuditContext {
  timestamp: Date
  ipAddress: string
  userId: string | null
  userAgent: string
  severity: AuditSeverity
}

/**
 * Audit log filters for retrieval
 */
export interface AuditFilters {
  userId?: string
  action?: AuditAction
  resource?: string
  resourceId?: string
  schoolId?: string
  startDate?: Date
  endDate?: Date
  severity?: AuditSeverity
  limit?: number
  offset?: number
  search?: string
}

/**
 * Audit log entry with computed fields
 */
export interface AuditLogEntry {
  id: string
  userId: string | null
  action: AuditAction
  resource: string
  resourceId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  checksum: string
  user: {
    id: string
    name?: string
    email: string
  }
  severity?: AuditSeverity
  schoolId?: string
}

/**
 * Integrity verification result
 */
export interface IntegrityResult {
  isValid: boolean
  expectedChecksum: string
  actualChecksum: string
  tamperedFields?: string[]
}

/**
 * Batch verification result
 */
export interface BatchVerificationResult {
  results: (IntegrityResult & { logId: string })[]
  summary: {
    total: number
    valid: number
    invalid: number
    errors: number
  }
}

/**
 * Result pattern for error handling
 */
export type AuditResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  code?: string
}

/**
 * Request metadata cache for performance optimization
 */
class RequestMetadataCache {
  private cache = new Map<string, { ipAddress: string; userAgent: string; timestamp: number }>()
  private readonly ttl: number

  constructor(ttl: number = AUDIT_CONSTANTS.CACHE_TTL) {
    this.ttl = ttl
  }

  async getMetadata(requestId?: string): Promise<{ ipAddress: string; userAgent: string }> {
    const key = requestId || 'default'
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return { ipAddress: cached.ipAddress, userAgent: cached.userAgent }
    }
    
    const metadata = await getRequestMetadata()
    this.cache.set(key, { ...metadata, timestamp: Date.now() })
    
    // Cleanup old entries to prevent memory leaks
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    return metadata
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * Query builder for complex audit log filtering
 */
class AuditQueryBuilder {
  private queryFilters: Prisma.AuditLogWhereInput = {}

  addUserFilter(userId?: string): this {
    if (userId) this.queryFilters.userId = userId
    return this
  }

  addActionFilter(action?: AuditAction): this {
    if (action) this.queryFilters.action = action
    return this
  }

  addResourceFilter(resource?: string): this {
    if (resource) this.queryFilters.resource = resource
    return this
  }

  addResourceIdFilter(resourceId?: string): this {
    if (resourceId) this.queryFilters.resourceId = resourceId
    return this
  }

  addDateRangeFilter(startDate?: Date, endDate?: Date): this {
    if (startDate || endDate) {
      this.queryFilters.timestamp = {}
      if (startDate) this.queryFilters.timestamp.gte = startDate
      if (endDate) this.queryFilters.timestamp.lte = endDate
    }
    return this
  }

  addSchoolFilter(schoolId?: string): this {
    if (schoolId) {
      this.queryFilters.OR = [
        { changes: { path: ['schoolId'], equals: schoolId } },
        { changes: { path: ['metadata', 'schoolId'], equals: schoolId } }
      ]
    }
    return this
  }

  addSeverityFilter(severity?: AuditSeverity): this {
    if (severity) {
      this.queryFilters.changes = {
        path: ['severity'],
        equals: severity
      }
    }
    return this
  }

  addSearchFilter(search?: string): this {
    if (search) {
      this.queryFilters.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }
    return this
  }

  build(): Prisma.AuditLogWhereInput {
    return this.queryFilters
  }
}

/**
 * Export strategy interface
 */
interface ExportStrategy {
  export(logs: AuditLogEntry[]): { data: string; contentType: string }
}

/**
 * JSON export strategy
 */
class JsonExportStrategy implements ExportStrategy {
  export(logs: AuditLogEntry[]) {
    return {
      data: JSON.stringify(logs, null, 2),
      contentType: 'application/json'
    }
  }
}

/**
 * CSV export strategy
 */
class CsvExportStrategy implements ExportStrategy {
  export(logs: AuditLogEntry[]) {
    const headers = [
      'ID', 'User ID', 'User Email', 'Action', 'Resource', 'Resource ID',
      'IP Address', 'Timestamp', 'Severity', 'School ID'
    ]
    
    const csvRows = logs.map(log => [
      log.id,
      log.userId,
      log.user.email,
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress || '',
      log.timestamp.toISOString(),
      log.severity || '',
      log.schoolId || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')
    
    return {
      data: csvContent,
      contentType: 'text/csv'
    }
  }
}

/**
 * Audit exporter using strategy pattern
 */
class AuditExporter {
  private strategies = new Map<string, ExportStrategy>([
    ['json', new JsonExportStrategy()],
    ['csv', new CsvExportStrategy()]
  ])

  export(logs: AuditLogEntry[], format: string) {
    const strategy = this.strategies.get(format)
    if (!strategy) {
      throw new Error(`Unsupported export format: ${format}`)
    }
    return strategy.export(logs)
  }

  getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys())
  }
}

/**
 * Factory for creating audit contexts
 */
export class AuditContextFactory {
  static createSchoolManagementContext(
    userId: string,
    action: AuditAction,
    schoolId: string,
    changes?: Record<string, any>
  ): AuditContext {
    return {
      userId,
      action,
      resource: 'SCHOOL',
      resourceId: schoolId,
      changes,
      schoolId,
      severity: AuditSeverity.HIGH
    }
  }

  static createBillingContext(
    userId: string,
    action: AuditAction,
    resourceType: 'SUBSCRIPTION' | 'INVOICE' | 'PAYMENT',
    resourceId: string,
    schoolId?: string,
    changes?: Record<string, any>
  ): AuditContext {
    return {
      userId,
      action,
      resource: resourceType,
      resourceId,
      changes,
      schoolId,
      severity: AuditSeverity.HIGH
    }
  }

  static createSystemConfigContext(
    userId: string,
    action: AuditAction,
    configType: string,
    changes?: Record<string, any>
  ): AuditContext {
    return {
      userId,
      action,
      resource: 'SYSTEM_CONFIG',
      resourceId: configType,
      changes,
      severity: AuditSeverity.CRITICAL
    }
  }

  static createUserManagementContext(
    userId: string,
    action: AuditAction,
    targetUserId: string,
    changes?: Record<string, any>
  ): AuditContext {
    return {
      userId,
      action,
      resource: 'USER',
      resourceId: targetUserId,
      changes,
      severity: AuditSeverity.HIGH
    }
  }

  static createDataAccessContext(
    userId: string,
    resource: string,
    resourceId?: string,
    accessType: 'READ' | 'EXPORT' | 'DOWNLOAD' = 'READ',
    schoolId?: string
  ): AuditContext {
    return {
      userId,
      action: accessType as AuditAction,
      resource,
      resourceId,
      schoolId,
      severity: AuditSeverity.MEDIUM,
      metadata: {
        accessType,
        dataCategory: resource
      }
    }
  }
}

/**
 * Audit service class with dependency injection and configuration
 */
export class AuditService {
  private metadataCache: RequestMetadataCache
  private exporter: AuditExporter
  private config: AuditServiceConfig

  constructor(config: Partial<AuditServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metadataCache = new RequestMetadataCache(this.config.cacheTimeout)
    this.exporter = new AuditExporter()
  }

  /**
   * Main audit logging function with improved error handling
   */
  async logAuditEvent(context: AuditContext): Promise<AuditResult<void>> {
    try {
      const enrichedContext = await this.enrichAuditContext(context)
      const auditData = this.buildAuditData(enrichedContext)
      await this.persistAuditLog(auditData)
      await this.handlePostLogging(enrichedContext, auditData)
      
      return { success: true, data: undefined }
    } catch (error) {
      await this.handleAuditError(error, context)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown audit error',
        code: 'AUDIT_LOG_FAILED'
      }
    }
  }

  /**
   * Enrich audit context with metadata and defaults
   */
  private async enrichAuditContext(context: AuditContext): Promise<EnrichedAuditContext> {
    const metadata = await this.metadataCache.getMetadata()
    
    return {
      ...context,
      ipAddress: context.ipAddress || metadata.ipAddress,
      userAgent: context.userAgent || metadata.userAgent,
      severity: context.severity || this.config.defaultSeverity,
      timestamp: new Date()
    }
  }

  /**
   * Build audit data object for persistence
   */
  private buildAuditData(context: EnrichedAuditContext) {
    const checksum = this.generateChecksum({
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      resourceId: context.resourceId,
      changes: context.changes,
      timestamp: context.timestamp
    })

    return {
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      resourceId: context.resourceId || null,
      changes: {
        ...context.changes,
        metadata: context.metadata,
        severity: context.severity,
        schoolId: context.schoolId,
        timestamp: context.timestamp.toISOString()
      },
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      timestamp: context.timestamp,
      checksum
    }
  }

  /**
   * Persist audit log to database
   */
  private async persistAuditLog(auditData: any): Promise<void> {
    try {
      await db.auditLog.create({ data: auditData })
    } catch (error) {
      // Handle edge runtime errors gracefully
      if (error instanceof Error && error.message.includes('Edge Runtime')) {
        console.warn('Audit logging skipped in Edge Runtime:', error.message);
        return;
      }
      throw error;
    }
  }

  /**
   * Handle post-logging activities
   */
  private async handlePostLogging(context: EnrichedAuditContext, auditData: any): Promise<void> {
    // Console logging in development
    if (this.config.enableConsoleLogging) {
      console.log(`[Audit] ${context.action} on ${context.resource}`, {
        userId: context.userId,
        resourceId: context.resourceId,
        severity: context.severity,
        ipAddress: context.ipAddress
      })
    }

    // Critical event logging
    if (this.config.enableCriticalEventLogging && context.severity === AuditSeverity.CRITICAL) {
      await this.logCriticalEvent(context, auditData)
    }
  }

  /**
   * Handle audit logging errors
   */
  private async handleAuditError(error: unknown, context: AuditContext): Promise<void> {
    console.error("Failed to log audit event:", error)
    
    try {
      // Skip database logging in edge runtime
      if (error instanceof Error && error.message.includes('Edge Runtime')) {
        console.warn('Audit error logging skipped in Edge Runtime');
        return;
      }
      
      await db.auditLog.create({
        data: {
          userId: context.userId,
          action: 'CREATE' as AuditAction,
          resource: 'AUDIT_LOG',
          changes: {
            error: 'Failed to log audit event',
            originalContext: JSON.parse(JSON.stringify(context)),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date(),
          checksum: AUDIT_CONSTANTS.ERROR_LOG_CHECKSUM
        }
      })
    } catch (secondaryError) {
      console.error("Failed to log audit failure:", secondaryError)
    }
  }

  /**
   * Generate integrity checksum for audit log entry
   */
  private generateChecksum(data: {
    userId: string | null
    action: string
    resource: string
    resourceId?: string
    changes?: Record<string, any>
    timestamp: Date
  }): string {
    const content = JSON.stringify({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || '',
      changes: data.changes || {},
      timestamp: data.timestamp.toISOString()
    })
    
    // Use Web Crypto API for Edge Runtime compatibility
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      // Browser environment - use Web Crypto API
      return btoa(content).slice(0, 32) // Simple hash for browser
    } else {
      // Node.js environment - use dynamic import for crypto
      try {
        const crypto = require('crypto')
        return crypto.createHash(this.config.checksumAlgorithm).update(content).digest('hex')
      } catch (error) {
        // Fallback to simple hash if crypto is not available
        return btoa(content).slice(0, 32)
      }
    }
  }

  /**
   * Log critical events to external monitoring systems
   */
  private async logCriticalEvent(context: EnrichedAuditContext, auditData: any): Promise<void> {
    // This would integrate with external monitoring services like DataDog, New Relic, etc.
    console.warn(`[CRITICAL AUDIT EVENT]`, {
      timestamp: context.timestamp.toISOString(),
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      resourceId: context.resourceId,
      severity: context.severity,
      ipAddress: auditData.ipAddress
    })
  }

  /**
   * Retrieve audit logs with filtering and search capabilities
   */
  async getAuditLogs(filters: AuditFilters = {}): Promise<AuditResult<{
    logs: AuditLogEntry[]
    total: number
    hasMore: boolean
  }>> {
    try {
      const {
        limit = AUDIT_CONSTANTS.DEFAULT_LIMIT,
        offset = 0
      } = filters

      // Build query using query builder
      const queryFilters = new AuditQueryBuilder()
        .addUserFilter(filters.userId)
        .addActionFilter(filters.action)
        .addResourceFilter(filters.resource)
        .addResourceIdFilter(filters.resourceId)
        .addDateRangeFilter(filters.startDate, filters.endDate)
        .addSchoolFilter(filters.schoolId)
        .addSeverityFilter(filters.severity)
        .addSearchFilter(filters.search)
        .build()

      // Get total count
      const total = await db.auditLog.count({ where: queryFilters })

      // Get logs with user information
      const logs = await db.auditLog.findMany({
        where: queryFilters,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      })

      // Transform to AuditLogEntry format
      const transformedLogs: AuditLogEntry[] = logs.map(log => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource || '',
        resourceId: log.resourceId || undefined,
        changes: log.changes as Record<string, any> || undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        timestamp: log.timestamp || new Date(),
        checksum: log.checksum || '',
        user: {
          id: log.user?.id || log.userId || '',
          name: log.user?.name || undefined,
          email: log.user?.email || ''
        },
        severity: (log.changes as any)?.severity as AuditSeverity,
        schoolId: (log.changes as any)?.schoolId || (log.changes as any)?.metadata?.schoolId
      }))

      return {
        success: true,
        data: {
          logs: transformedLogs,
          total,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      console.error("Failed to retrieve audit logs:", error)
      return {
        success: false,
        error: "Failed to retrieve audit logs",
        code: 'AUDIT_RETRIEVAL_FAILED'
      }
    }
  }

  /**
   * Verify the integrity of an audit log entry
   */
  async verifyAuditLogIntegrity(logId: string): Promise<AuditResult<IntegrityResult>> {
    try {
      const log = await db.auditLog.findUnique({
        where: { id: logId }
      })

      if (!log) {
        return {
          success: false,
          error: "Audit log entry not found",
          code: 'LOG_NOT_FOUND'
        }
      }

      // Recalculate checksum
      const expectedChecksum = this.generateChecksum({
        userId: log.userId,
        action: log.action,
        resource: log.resource || '',
        resourceId: log.resourceId || undefined,
        changes: log.changes as Record<string, any> || undefined,
        timestamp: log.timestamp || new Date()
      })

      const isValid = expectedChecksum === log.checksum

      return {
        success: true,
        data: {
          isValid,
          expectedChecksum,
          actualChecksum: log.checksum || '',
          tamperedFields: isValid ? undefined : ['checksum']
        }
      }
    } catch (error) {
      console.error("Failed to verify audit log integrity:", error)
      return {
        success: false,
        error: "Failed to verify audit log integrity",
        code: 'INTEGRITY_VERIFICATION_FAILED'
      }
    }
  }

  /**
   * Verify integrity of multiple audit logs in batch with parallel processing
   */
  async verifyAuditLogsBatch(logIds: string[]): Promise<AuditResult<BatchVerificationResult>> {
    try {
      const results: (IntegrityResult & { logId: string })[] = []
      
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < logIds.length; i += this.config.batchSize) {
        const batch = logIds.slice(i, i + this.config.batchSize)
        const batchPromises = batch.map(async (logId) => {
          const result = await this.verifyAuditLogIntegrity(logId)
          if (result.success) {
            return { ...result.data, logId }
          } else {
            return {
              logId,
              isValid: false,
              expectedChecksum: '',
              actualChecksum: '',
              tamperedFields: ['error']
            }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      // Calculate summary
      const summary = results.reduce(
        (acc, result) => ({
          total: acc.total + 1,
          valid: acc.valid + (result.isValid ? 1 : 0),
          invalid: acc.invalid + (!result.isValid && !result.tamperedFields?.includes('error') ? 1 : 0),
          errors: acc.errors + (result.tamperedFields?.includes('error') ? 1 : 0)
        }),
        { total: 0, valid: 0, invalid: 0, errors: 0 }
      )

      return {
        success: true,
        data: { results, summary }
      }
    } catch (error) {
      console.error("Failed to verify audit logs batch:", error)
      return {
        success: false,
        error: "Failed to verify audit logs batch",
        code: 'BATCH_VERIFICATION_FAILED'
      }
    }
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(
    filters: AuditFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<AuditResult<{
    data: string
    filename: string
    contentType: string
  }>> {
    try {
      const logsResult = await this.getAuditLogs({ 
        ...filters, 
        limit: this.config.maxExportLimit 
      })

      if (!logsResult.success) {
        return logsResult as AuditResult<any>
      }

      const { logs } = logsResult.data
      const timestamp = new Date().toISOString().split('T')[0]
      
      const exportResult = this.exporter.export(logs, format)
      
      return {
        success: true,
        data: {
          ...exportResult,
          filename: `audit-logs-${timestamp}.${format}`
        }
      }
    } catch (error) {
      console.error("Failed to export audit logs:", error)
      return {
        success: false,
        error: "Failed to export audit logs",
        code: 'EXPORT_FAILED'
      }
    }
  }

  /**
   * Clear metadata cache
   */
  clearCache(): void {
    this.metadataCache.clear()
  }

  /**
   * Get supported export formats
   */
  getSupportedExportFormats(): string[] {
    return this.exporter.getSupportedFormats()
  }
}

// Create default service instance
const auditService = new AuditService()

/**
 * Get IP address and user agent from request headers
 */
async function getRequestMetadata(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    const headersList = await getHeadersSafely()
    
    if (!headersList) {
      return { 
        ipAddress: AUDIT_CONSTANTS.UNKNOWN_VALUE, 
        userAgent: AUDIT_CONSTANTS.UNKNOWN_VALUE 
      }
    }

    // Try to get real IP from various headers (for proxies/load balancers)
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare
      headersList.get('x-forwarded-for') ||
      AUDIT_CONSTANTS.UNKNOWN_VALUE

    const userAgent = headersList.get('user-agent') || AUDIT_CONSTANTS.UNKNOWN_VALUE

    return { ipAddress, userAgent }
  } catch (error) {
    // If headers() fails (e.g., not in request context), return defaults
    return { 
      ipAddress: AUDIT_CONSTANTS.UNKNOWN_VALUE, 
      userAgent: AUDIT_CONSTANTS.UNKNOWN_VALUE 
    }
  }
}

// Export default service instance and convenience functions for backward compatibility

/**
 * Main audit logging function (backward compatible)
 */
export async function logAuditEvent(context: AuditContext): Promise<void> {
  try {
    const result = await auditService.logAuditEvent(context)
    if (!result.success) {
      // Handle edge runtime errors gracefully
      if (result.error?.includes('Edge Runtime')) {
        console.warn('Audit logging skipped in Edge Runtime:', result.error);
        return;
      }
      throw new Error(result.error)
    }
  } catch (error) {
    // Handle edge runtime errors gracefully
    if (error instanceof Error && error.message.includes('Edge Runtime')) {
      console.warn('Audit logging skipped in Edge Runtime:', error.message);
      return;
    }
    throw error;
  }
}

/**
 * Retrieve audit logs with filtering and search capabilities (backward compatible)
 */
export async function getAuditLogs(filters: AuditFilters = {}): Promise<{
  logs: AuditLogEntry[]
  total: number
  hasMore: boolean
}> {
  const result = await auditService.getAuditLogs(filters)
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

/**
 * Verify the integrity of an audit log entry (backward compatible)
 */
export async function verifyAuditLogIntegrity(logId: string): Promise<IntegrityResult> {
  const result = await auditService.verifyAuditLogIntegrity(logId)
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

/**
 * Verify integrity of multiple audit logs in batch (backward compatible)
 */
export async function verifyAuditLogsBatch(logIds: string[]): Promise<BatchVerificationResult> {
  const result = await auditService.verifyAuditLogsBatch(logIds)
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

/**
 * Export audit logs for compliance reporting (backward compatible)
 */
export async function exportAuditLogs(
  filters: AuditFilters,
  format: 'json' | 'csv' = 'json'
): Promise<{
  data: string
  filename: string
  contentType: string
}> {
  const result = await auditService.exportAuditLogs(filters, format)
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

// Convenience functions for common audit events using factory

/**
 * Log super-admin school management actions
 */
export async function logSchoolManagementAction(
  userId: string,
  action: AuditAction,
  schoolId: string,
  changes?: Record<string, any>
): Promise<void> {
  const context = AuditContextFactory.createSchoolManagementContext(
    userId, action, schoolId, changes
  )
  await logAuditEvent(context)
}

/**
 * Log billing and subscription actions
 */
export async function logBillingAction(
  userId: string,
  action: AuditAction,
  resourceType: 'SUBSCRIPTION' | 'INVOICE' | 'PAYMENT',
  resourceId: string,
  schoolId?: string,
  changes?: Record<string, any>
): Promise<void> {
  const context = AuditContextFactory.createBillingContext(
    userId, action, resourceType, resourceId, schoolId, changes
  )
  await logAuditEvent(context)
}

/**
 * Log system configuration changes
 */
export async function logSystemConfigAction(
  userId: string,
  action: AuditAction,
  configType: string,
  changes?: Record<string, any>
): Promise<void> {
  const context = AuditContextFactory.createSystemConfigContext(
    userId, action, configType, changes
  )
  await logAuditEvent(context)
}

/**
 * Log user management actions
 */
export async function logUserManagementAction(
  userId: string,
  action: AuditAction,
  targetUserId: string,
  changes?: Record<string, any>
): Promise<void> {
  const context = AuditContextFactory.createUserManagementContext(
    userId, action, targetUserId, changes
  )
  await logAuditEvent(context)
}

/**
 * Log data access patterns for compliance
 */
export async function logDataAccess(
  userId: string,
  resource: string,
  resourceId?: string,
  accessType: 'READ' | 'EXPORT' | 'DOWNLOAD' = 'READ',
  schoolId?: string
): Promise<void> {
  const context = AuditContextFactory.createDataAccessContext(
    userId, resource, resourceId, accessType, schoolId
  )
  await logAuditEvent(context)
}

// Export service instance for advanced usage
export { auditService }