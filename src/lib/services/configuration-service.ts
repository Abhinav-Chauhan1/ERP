/**
 * Configuration Service for System-Wide Settings Management
 * 
 * Provides comprehensive configuration management including global settings,
 * feature flags with gradual rollouts, email template management, and
 * secure third-party service configuration.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { db } from "@/lib/db"
import * as crypto from "crypto"
import { logSystemConfigAction } from "./audit-service"

// Types and Interfaces

export interface SystemConfigurationData {
  key: string
  value: any
  description?: string
  category: 'GLOBAL' | 'FEATURE_FLAG' | 'EMAIL_TEMPLATE' | 'INTEGRATION' | 'USAGE_LIMIT'
  environment?: string
  requiresRestart?: boolean
  validationSchema?: any
  metadata?: Record<string, any>
}

export interface FeatureFlagData {
  name: string
  description?: string
  isEnabled: boolean
  rolloutPercentage?: number
  rolloutStrategy?: 'PERCENTAGE' | 'USER_LIST' | 'SCHOOL_LIST'
  targetUsers?: string[]
  targetSchools?: string[]
  conditions?: Record<string, any>
  environment?: string
  startDate?: Date
  endDate?: Date
}

export interface EmailTemplateData {
  name: string
  category: 'BILLING' | 'NOTIFICATION' | 'SYSTEM' | 'MARKETING'
  subject: string
  htmlContent: string
  textContent?: string
  variables: Record<string, any>
  previewData?: Record<string, any>
  metadata?: Record<string, any>
}

export interface IntegrationConfigurationData {
  serviceName: string
  environment?: string
  configuration: Record<string, any>
  testConfiguration?: Record<string, any>
  webhookUrl?: string
  webhookSecret?: string
  rateLimits?: Record<string, any>
  healthCheckUrl?: string
  metadata?: Record<string, any>
}

export interface UsageLimitData {
  name: string
  description?: string
  resourceType: 'SMS' | 'WHATSAPP' | 'STORAGE' | 'API_CALLS' | 'USERS'
  limitType: 'GLOBAL' | 'PER_SCHOOL' | 'PER_USER'
  schoolId?: string
  limitValue: number
  resetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  resetDay?: number
  alertThreshold?: number
  hardLimit?: boolean
  metadata?: Record<string, any>
}

export interface ConfigurationFilters {
  category?: string
  environment?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

// Encryption utilities for sensitive configuration data
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'default-key-change-in-production'

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Configuration Service Class
 * 
 * Implements comprehensive configuration management with audit trails,
 * environment support, and security features.
 */
export class ConfigurationService {
  
  // Global Settings Management (Requirement 7.1)
  
  /**
   * Create or update a system configuration
   */
  async setConfiguration(
    userId: string,
    data: SystemConfigurationData
  ): Promise<any> {
    try {
      // Validate configuration value against schema if provided
      if (data.validationSchema) {
        await this.validateConfigurationValue(data.value, data.validationSchema)
      }

      // Check if configuration exists
      const existing = await db.systemConfiguration.findUnique({
        where: {
          key: data.key
        }
      })

      let result
      if (existing) {
        // Log the change for audit
        await this.logConfigurationChange(
          userId,
          existing.id,
          'SYSTEM_CONFIG',
          'UPDATE',
          existing.value,
          data.value,
          'Configuration updated'
        )

        result = await db.systemConfiguration.update({
          where: { id: existing.id },
          data: {
            value: data.value,
            description: data.description,
            category: data.category,
            environment: data.environment || 'production',
            requiresRestart: data.requiresRestart || false,
            validationSchema: data.validationSchema,
            metadata: data.metadata,
            updatedBy: userId
          }
        })
      } else {
        result = await db.systemConfiguration.create({
          data: {
            key: data.key,
            value: data.value,
            description: data.description,
            category: data.category,
            environment: data.environment || 'production',
            requiresRestart: data.requiresRestart || false,
            validationSchema: data.validationSchema,
            metadata: data.metadata,
            createdBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'SYSTEM_CONFIG',
          'CREATE',
          null,
          data.value,
          'Configuration created'
        )
      }

      // Log audit event
      await logSystemConfigAction(
        userId,
        existing ? 'UPDATE' : 'CREATE',
        data.key,
        { configuration: data }
      )

      return result
    } catch (error) {
      console.error('Failed to set configuration:', error)
      throw new Error('Failed to set configuration')
    }
  }

  /**
   * Get a system configuration by key
   */
  async getConfiguration(key: string, environment: string = 'production'): Promise<any> {
    try {
      const config = await db.systemConfiguration.findFirst({
        where: {
          key,
          environment,
          isActive: true
        }
      })

      return config?.value || null
    } catch (error) {
      console.error('Failed to get configuration:', error)
      return null
    }
  }

  /**
   * Get multiple configurations with filtering
   */
  async getConfigurations(filters: ConfigurationFilters = {}): Promise<{
    configurations: any[]
    total: number
  }> {
    try {
      const {
        category,
        environment = 'production',
        isActive = true,
        search,
        limit = 50,
        offset = 0
      } = filters

      const where: any = {
        environment,
        isActive
      }

      if (category) where.category = category
      if (search) {
        where.OR = [
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      const [configurations, total] = await Promise.all([
        db.systemConfiguration.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            updater: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset
        }),
        db.systemConfiguration.count({ where })
      ])

      return { configurations, total }
    } catch (error) {
      console.error('Failed to get configurations:', error)
      throw new Error('Failed to get configurations')
    }
  }

  // Feature Flag Management (Requirement 7.2)

  /**
   * Create or update a feature flag with gradual rollout support
   */
  async setFeatureFlag(
    userId: string,
    data: FeatureFlagData
  ): Promise<any> {
    try {
      const existing = await db.featureFlag.findUnique({
        where: { name: data.name }
      })

      let result
      if (existing) {
        await this.logConfigurationChange(
          userId,
          existing.id,
          'FEATURE_FLAG',
          'UPDATE',
          {
            isEnabled: existing.isEnabled,
            rolloutPercentage: existing.rolloutPercentage
          },
          {
            isEnabled: data.isEnabled,
            rolloutPercentage: data.rolloutPercentage
          },
          'Feature flag updated'
        )

        result = await db.featureFlag.update({
          where: { id: existing.id },
          data: {
            description: data.description,
            isEnabled: data.isEnabled,
            rolloutPercentage: data.rolloutPercentage || 0,
            rolloutStrategy: data.rolloutStrategy || 'PERCENTAGE',
            targetUsers: data.targetUsers || [],
            targetSchools: data.targetSchools || [],
            conditions: data.conditions,
            environment: data.environment || 'production',
            startDate: data.startDate,
            endDate: data.endDate,
            updatedBy: userId
          }
        })
      } else {
        result = await db.featureFlag.create({
          data: {
            name: data.name,
            description: data.description,
            isEnabled: data.isEnabled,
            rolloutPercentage: data.rolloutPercentage || 0,
            rolloutStrategy: data.rolloutStrategy || 'PERCENTAGE',
            targetUsers: data.targetUsers || [],
            targetSchools: data.targetSchools || [],
            conditions: data.conditions,
            environment: data.environment || 'production',
            startDate: data.startDate,
            endDate: data.endDate,
            createdBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'FEATURE_FLAG',
          'CREATE',
          null,
          { isEnabled: data.isEnabled, rolloutPercentage: data.rolloutPercentage },
          'Feature flag created'
        )
      }

      await logSystemConfigAction(
        userId,
        existing ? 'UPDATE' : 'CREATE',
        `feature_flag_${data.name}`,
        { featureFlag: data }
      )

      return result
    } catch (error) {
      console.error('Failed to set feature flag:', error)
      throw new Error('Failed to set feature flag')
    }
  }

  /**
   * Check if a feature flag is enabled for a specific user/school
   */
  async isFeatureEnabled(
    flagName: string,
    userId?: string,
    schoolId?: string,
    environment: string = 'production'
  ): Promise<boolean> {
    try {
      const flag = await db.featureFlag.findFirst({
        where: {
          name: flagName,
          environment,
          isEnabled: true
        }
      })

      if (!flag) return false

      // Check date constraints
      const now = new Date()
      if (flag.startDate && now < flag.startDate) return false
      if (flag.endDate && now > flag.endDate) return false

      // Apply rollout strategy
      switch (flag.rolloutStrategy) {
        case 'USER_LIST':
          return userId ? flag.targetUsers.includes(userId) : false

        case 'SCHOOL_LIST':
          return schoolId ? flag.targetSchools.includes(schoolId) : false

        case 'PERCENTAGE':
        default:
          // Use deterministic hash for consistent rollout
          const identifier = userId || schoolId || 'anonymous'
          const hash = crypto.createHash('md5').update(`${flagName}:${identifier}`).digest('hex')
          const hashNumber = parseInt(hash.substring(0, 8), 16)
          const percentage = (hashNumber % 100) + 1
          return percentage <= flag.rolloutPercentage
      }
    } catch (error) {
      console.error('Failed to check feature flag:', error)
      return false
    }
  }

  /**
   * Get all feature flags with their status
   */
  async getFeatureFlags(environment: string = 'production'): Promise<any[]> {
    try {
      return await db.featureFlag.findMany({
        where: { environment },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          updater: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get feature flags:', error)
      throw new Error('Failed to get feature flags')
    }
  }

  // Email Template Management (Requirement 7.3)

  /**
   * Create or update an email template with preview support
   */
  async setEmailTemplate(
    userId: string,
    data: EmailTemplateData
  ): Promise<any> {
    try {
      const existing = await db.emailTemplate.findFirst({
        where: {
          name: data.name,
          category: data.category
        }
      })

      let result
      if (existing) {
        // Create new version
        const newVersion = this.incrementVersion(existing.version)
        
        result = await db.emailTemplate.create({
          data: {
            name: data.name,
            category: data.category,
            subject: data.subject,
            htmlContent: data.htmlContent,
            textContent: data.textContent,
            variables: data.variables,
            version: newVersion,
            parentTemplateId: existing.id,
            previewData: data.previewData,
            metadata: data.metadata,
            createdBy: userId
          }
        })

        // Deactivate old version
        await db.emailTemplate.update({
          where: { id: existing.id },
          data: { isActive: false }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'EMAIL_TEMPLATE',
          'UPDATE',
          { version: existing.version },
          { version: newVersion },
          'Email template updated with new version'
        )
      } else {
        result = await db.emailTemplate.create({
          data: {
            name: data.name,
            category: data.category,
            subject: data.subject,
            htmlContent: data.htmlContent,
            textContent: data.textContent,
            variables: data.variables,
            previewData: data.previewData,
            metadata: data.metadata,
            createdBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'EMAIL_TEMPLATE',
          'CREATE',
          null,
          { name: data.name, category: data.category },
          'Email template created'
        )
      }

      await logSystemConfigAction(
        userId,
        existing ? 'UPDATE' : 'CREATE',
        `email_template_${data.name}`,
        { template: data }
      )

      return result
    } catch (error) {
      console.error('Failed to set email template:', error)
      throw new Error('Failed to set email template')
    }
  }

  /**
   * Get an email template by name and category
   */
  async getEmailTemplate(name: string, category: string): Promise<any> {
    try {
      return await db.emailTemplate.findFirst({
        where: {
          name,
          category,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get email template:', error)
      return null
    }
  }

  /**
   * Preview an email template with sample data
   */
  async previewEmailTemplate(
    templateId: string,
    previewData?: Record<string, any>
  ): Promise<{
    subject: string
    htmlContent: string
    textContent?: string
  }> {
    try {
      const template = await db.emailTemplate.findUnique({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error('Template not found')
      }

      const data = previewData || template.previewData || {}
      
      // Simple template variable replacement
      const processTemplate = (content: string) => {
        return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return data[key] || match
        })
      }

      return {
        subject: processTemplate(template.subject),
        htmlContent: processTemplate(template.htmlContent),
        textContent: template.textContent ? processTemplate(template.textContent) : undefined
      }
    } catch (error) {
      console.error('Failed to preview email template:', error)
      throw new Error('Failed to preview email template')
    }
  }

  /**
   * Get all email templates by category
   */
  async getEmailTemplates(category?: string): Promise<any[]> {
    try {
      const where: any = { isActive: true }
      if (category) where.category = category

      return await db.emailTemplate.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get email templates:', error)
      throw new Error('Failed to get email templates')
    }
  }

  // Integration Configuration (Requirement 7.4)

  /**
   * Set secure third-party service configuration
   */
  async setIntegrationConfiguration(
    userId: string,
    data: IntegrationConfigurationData
  ): Promise<any> {
    try {
      // Encrypt sensitive configuration data
      const encryptedConfig = encrypt(JSON.stringify(data.configuration))
      const encryptedTestConfig = data.testConfiguration 
        ? encrypt(JSON.stringify(data.testConfiguration))
        : null
      const encryptedWebhookSecret = data.webhookSecret 
        ? encrypt(data.webhookSecret)
        : null

      const existing = await db.integrationConfiguration.findFirst({
        where: {
          serviceName: data.serviceName,
          environment: data.environment || 'production'
        }
      })

      let result
      if (existing) {
        result = await db.integrationConfiguration.update({
          where: { id: existing.id },
          data: {
            configuration: encryptedConfig,
            testConfiguration: encryptedTestConfig,
            webhookUrl: data.webhookUrl,
            webhookSecret: encryptedWebhookSecret,
            rateLimits: data.rateLimits,
            healthCheckUrl: data.healthCheckUrl,
            metadata: data.metadata,
            updatedBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'INTEGRATION',
          'UPDATE',
          { serviceName: existing.serviceName },
          { serviceName: data.serviceName },
          'Integration configuration updated'
        )
      } else {
        result = await db.integrationConfiguration.create({
          data: {
            serviceName: data.serviceName,
            environment: data.environment || 'production',
            configuration: encryptedConfig,
            testConfiguration: encryptedTestConfig,
            webhookUrl: data.webhookUrl,
            webhookSecret: encryptedWebhookSecret,
            rateLimits: data.rateLimits,
            healthCheckUrl: data.healthCheckUrl,
            metadata: data.metadata,
            createdBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'INTEGRATION',
          'CREATE',
          null,
          { serviceName: data.serviceName },
          'Integration configuration created'
        )
      }

      await logSystemConfigAction(
        userId,
        existing ? 'UPDATE' : 'CREATE',
        `integration_${data.serviceName}`,
        { serviceName: data.serviceName, environment: data.environment }
      )

      return result
    } catch (error) {
      console.error('Failed to set integration configuration:', error)
      throw new Error('Failed to set integration configuration')
    }
  }

  /**
   * Get decrypted integration configuration
   */
  async getIntegrationConfiguration(
    serviceName: string,
    environment: string = 'production'
  ): Promise<any> {
    try {
      const config = await db.integrationConfiguration.findFirst({
        where: {
          serviceName,
          environment,
          isActive: true
        }
      })

      if (!config) return null

      // Decrypt sensitive data
      const decryptedConfig = JSON.parse(decrypt(config.configuration))
      const decryptedTestConfig = config.testConfiguration 
        ? JSON.parse(decrypt(config.testConfiguration))
        : null
      const decryptedWebhookSecret = config.webhookSecret 
        ? decrypt(config.webhookSecret)
        : null

      return {
        ...config,
        configuration: decryptedConfig,
        testConfiguration: decryptedTestConfig,
        webhookSecret: decryptedWebhookSecret
      }
    } catch (error) {
      console.error('Failed to get integration configuration:', error)
      return null
    }
  }

  // Usage Limit Management (Requirement 7.5)

  /**
   * Set global or per-school usage limits
   */
  async setUsageLimit(
    userId: string,
    data: UsageLimitData
  ): Promise<any> {
    try {
      const existing = await db.usageLimit.findFirst({
        where: {
          name: data.name,
          schoolId: data.schoolId || null
        }
      })

      let result
      if (existing) {
        result = await db.usageLimit.update({
          where: { id: existing.id },
          data: {
            description: data.description,
            resourceType: data.resourceType,
            limitType: data.limitType,
            limitValue: data.limitValue,
            resetPeriod: data.resetPeriod,
            resetDay: data.resetDay,
            alertThreshold: data.alertThreshold,
            hardLimit: data.hardLimit || false,
            metadata: data.metadata,
            updatedBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'USAGE_LIMIT',
          'UPDATE',
          { limitValue: existing.limitValue },
          { limitValue: data.limitValue },
          'Usage limit updated'
        )
      } else {
        result = await db.usageLimit.create({
          data: {
            name: data.name,
            description: data.description,
            resourceType: data.resourceType,
            limitType: data.limitType,
            schoolId: data.schoolId,
            limitValue: data.limitValue,
            resetPeriod: data.resetPeriod,
            resetDay: data.resetDay,
            alertThreshold: data.alertThreshold,
            hardLimit: data.hardLimit || false,
            metadata: data.metadata,
            createdBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          result.id,
          'USAGE_LIMIT',
          'CREATE',
          null,
          { name: data.name, limitValue: data.limitValue },
          'Usage limit created'
        )
      }

      await logSystemConfigAction(
        userId,
        existing ? 'UPDATE' : 'CREATE',
        `usage_limit_${data.name}`,
        { usageLimit: data }
      )

      return result
    } catch (error) {
      console.error('Failed to set usage limit:', error)
      throw new Error('Failed to set usage limit')
    }
  }

  /**
   * Get usage limits for a school or global limits
   */
  async getUsageLimits(schoolId?: string): Promise<any[]> {
    try {
      return await db.usageLimit.findMany({
        where: {
          schoolId: schoolId || null,
          isActive: true
        },
        include: {
          school: schoolId ? {
            select: { id: true, name: true }
          } : undefined
        },
        orderBy: { resourceType: 'asc' }
      })
    } catch (error) {
      console.error('Failed to get usage limits:', error)
      throw new Error('Failed to get usage limits')
    }
  }

  /**
   * Check if usage limit is exceeded
   */
  async checkUsageLimit(
    resourceType: string,
    schoolId?: string
  ): Promise<{
    isExceeded: boolean
    currentUsage: number
    limitValue: number
    alertThreshold?: number
    shouldAlert: boolean
  }> {
    try {
      const limit = await db.usageLimit.findFirst({
        where: {
          resourceType,
          schoolId: schoolId || null,
          isActive: true
        }
      })

      if (!limit) {
        return {
          isExceeded: false,
          currentUsage: 0,
          limitValue: Infinity,
          shouldAlert: false
        }
      }

      const usagePercentage = (limit.currentUsage / limit.limitValue) * 100
      const shouldAlert = limit.alertThreshold 
        ? usagePercentage >= limit.alertThreshold
        : false

      return {
        isExceeded: limit.currentUsage >= limit.limitValue,
        currentUsage: limit.currentUsage,
        limitValue: limit.limitValue,
        alertThreshold: limit.alertThreshold || undefined,
        shouldAlert
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error)
      return {
        isExceeded: false,
        currentUsage: 0,
        limitValue: Infinity,
        shouldAlert: false
      }
    }
  }

  // Helper Methods

  /**
   * Validate configuration value against JSON schema
   */
  private async validateConfigurationValue(value: any, schema: any): Promise<void> {
    // Simple validation - in production, use a proper JSON schema validator
    if (schema.type === 'number' && typeof value !== 'number') {
      throw new Error('Configuration value must be a number')
    }
    if (schema.type === 'string' && typeof value !== 'string') {
      throw new Error('Configuration value must be a string')
    }
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      throw new Error('Configuration value must be a boolean')
    }
  }

  /**
   * Increment version string (e.g., "1.0" -> "1.1")
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.')
    const minor = parseInt(parts[1] || '0') + 1
    return `${parts[0]}.${minor}`
  }

  /**
   * Log configuration changes for audit trail
   */
  private async logConfigurationChange(
    userId: string,
    configurationId: string,
    configurationType: string,
    changeType: string,
    previousValue: any,
    newValue: any,
    reason?: string
  ): Promise<void> {
    try {
      await db.configurationHistory.create({
        data: {
          configurationId,
          configurationType,
          changeType,
          previousValue,
          newValue,
          reason,
          changedBy: userId
        }
      })
    } catch (error) {
      console.error('Failed to log configuration change:', error)
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Get configuration change history
   */
  async getConfigurationHistory(
    configurationId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await db.configurationHistory.findMany({
        where: { configurationId },
        include: {
          changer: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { changedAt: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('Failed to get configuration history:', error)
      throw new Error('Failed to get configuration history')
    }
  }

  /**
   * Environment-specific configuration support (Requirement 7.6)
   */
  async getEnvironmentConfigurations(environment: string): Promise<{
    systemConfigurations: any[]
    featureFlags: any[]
    integrations: any[]
  }> {
    try {
      const [systemConfigurations, featureFlags, integrations] = await Promise.all([
        db.systemConfiguration.findMany({
          where: { environment, isActive: true },
          orderBy: { key: 'asc' }
        }),
        db.featureFlag.findMany({
          where: { environment },
          orderBy: { name: 'asc' }
        }),
        db.integrationConfiguration.findMany({
          where: { environment, isActive: true },
          select: {
            id: true,
            serviceName: true,
            isActive: true,
            healthStatus: true,
            lastHealthCheck: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { serviceName: 'asc' }
        })
      ])

      return {
        systemConfigurations,
        featureFlags,
        integrations
      }
    } catch (error) {
      console.error('Failed to get environment configurations:', error)
      throw new Error('Failed to get environment configurations')
    }
  }

  /**
   * Health check for integration services
   */
  async performIntegrationHealthCheck(serviceName: string, environment: string = 'production'): Promise<{
    isHealthy: boolean
    responseTime?: number
    error?: string
  }> {
    try {
      const config = await db.integrationConfiguration.findFirst({
        where: { serviceName, environment, isActive: true }
      })

      if (!config || !config.healthCheckUrl) {
        return { isHealthy: false, error: 'No health check URL configured' }
      }

      const startTime = Date.now()
      
      try {
        const response = await fetch(config.healthCheckUrl, {
          method: 'GET',
          timeout: 10000 // 10 second timeout
        })

        const responseTime = Date.now() - startTime
        const isHealthy = response.ok

        // Update health status in database
        await db.integrationConfiguration.update({
          where: { id: config.id },
          data: {
            healthStatus: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
            lastHealthCheck: new Date()
          }
        })

        return {
          isHealthy,
          responseTime,
          error: isHealthy ? undefined : `HTTP ${response.status}`
        }
      } catch (fetchError) {
        // Update health status to unhealthy
        await db.integrationConfiguration.update({
          where: { id: config.id },
          data: {
            healthStatus: 'UNHEALTHY',
            lastHealthCheck: new Date()
          }
        })

        return {
          isHealthy: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }
      }
    } catch (error) {
      console.error('Failed to perform health check:', error)
      return {
        isHealthy: false,
        error: 'Health check failed'
      }
    }
  }
}

// Export singleton instance
export const configurationService = new ConfigurationService()

// Extended Integration and Usage Limit Configuration (Requirements 7.4, 7.5, 7.6)

/**
 * Integration Management Service Extension
 * 
 * Provides advanced integration management with health monitoring,
 * rate limiting, and environment-specific configurations.
 */
export class IntegrationManagementService extends ConfigurationService {

  /**
   * Bulk update integration configurations across environments
   */
  async bulkUpdateIntegrations(
    userId: string,
    updates: Array<{
      serviceName: string
      environment: string
      configuration: Record<string, any>
      isActive?: boolean
    }>
  ): Promise<{
    successful: number
    failed: Array<{ serviceName: string; environment: string; error: string }>
  }> {
    let successful = 0
    const failed: Array<{ serviceName: string; environment: string; error: string }> = []

    for (const update of updates) {
      try {
        await this.setIntegrationConfiguration(userId, {
          serviceName: update.serviceName,
          environment: update.environment,
          configuration: update.configuration
        })

        if (update.isActive !== undefined) {
          await db.integrationConfiguration.updateMany({
            where: {
              serviceName: update.serviceName,
              environment: update.environment
            },
            data: { isActive: update.isActive }
          })
        }

        successful++
      } catch (error) {
        failed.push({
          serviceName: update.serviceName,
          environment: update.environment,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    await logSystemConfigAction(
      userId,
      'UPDATE',
      'bulk_integration_update',
      { successful, failed: failed.length, updates: updates.length }
    )

    return { successful, failed }
  }

  /**
   * Get integration status across all environments
   */
  async getIntegrationStatus(): Promise<{
    services: Array<{
      serviceName: string
      environments: Array<{
        environment: string
        isActive: boolean
        healthStatus: string
        lastHealthCheck?: Date
        responseTime?: number
      }>
    }>
  }> {
    try {
      const integrations = await db.integrationConfiguration.findMany({
        select: {
          serviceName: true,
          environment: true,
          isActive: true,
          healthStatus: true,
          lastHealthCheck: true,
          metadata: true
        },
        orderBy: [
          { serviceName: 'asc' },
          { environment: 'asc' }
        ]
      })

      // Group by service name
      const serviceMap = new Map<string, any[]>()
      
      for (const integration of integrations) {
        if (!serviceMap.has(integration.serviceName)) {
          serviceMap.set(integration.serviceName, [])
        }
        
        serviceMap.get(integration.serviceName)!.push({
          environment: integration.environment,
          isActive: integration.isActive,
          healthStatus: integration.healthStatus,
          lastHealthCheck: integration.lastHealthCheck,
          responseTime: (integration.metadata as any)?.lastResponseTime
        })
      }

      const services = Array.from(serviceMap.entries()).map(([serviceName, environments]) => ({
        serviceName,
        environments
      }))

      return { services }
    } catch (error) {
      console.error('Failed to get integration status:', error)
      throw new Error('Failed to get integration status')
    }
  }

  /**
   * Perform health checks for all active integrations
   */
  async performAllHealthChecks(): Promise<{
    results: Array<{
      serviceName: string
      environment: string
      isHealthy: boolean
      responseTime?: number
      error?: string
    }>
    summary: {
      total: number
      healthy: number
      unhealthy: number
    }
  }> {
    try {
      const integrations = await db.integrationConfiguration.findMany({
        where: { isActive: true },
        select: {
          serviceName: true,
          environment: true,
          healthCheckUrl: true
        }
      })

      const results = []
      let healthy = 0
      let unhealthy = 0

      for (const integration of integrations) {
        const result = await this.performIntegrationHealthCheck(
          integration.serviceName,
          integration.environment
        )

        results.push({
          serviceName: integration.serviceName,
          environment: integration.environment,
          ...result
        })

        if (result.isHealthy) {
          healthy++
        } else {
          unhealthy++
        }
      }

      return {
        results,
        summary: {
          total: integrations.length,
          healthy,
          unhealthy
        }
      }
    } catch (error) {
      console.error('Failed to perform all health checks:', error)
      throw new Error('Failed to perform all health checks')
    }
  }

  /**
   * Configure integration rate limits
   */
  async setIntegrationRateLimit(
    userId: string,
    serviceName: string,
    environment: string,
    rateLimits: {
      requestsPerMinute?: number
      requestsPerHour?: number
      requestsPerDay?: number
      burstLimit?: number
      concurrentRequests?: number
    }
  ): Promise<void> {
    try {
      const integration = await db.integrationConfiguration.findFirst({
        where: { serviceName, environment }
      })

      if (!integration) {
        throw new Error('Integration configuration not found')
      }

      await db.integrationConfiguration.update({
        where: { id: integration.id },
        data: {
          rateLimits,
          updatedBy: userId
        }
      })

      await this.logConfigurationChange(
        userId,
        integration.id,
        'INTEGRATION',
        'UPDATE',
        integration.rateLimits,
        rateLimits,
        'Rate limits updated'
      )

      await logSystemConfigAction(
        userId,
        'UPDATE',
        `integration_rate_limit_${serviceName}`,
        { serviceName, environment, rateLimits }
      )
    } catch (error) {
      console.error('Failed to set integration rate limit:', error)
      throw new Error('Failed to set integration rate limit')
    }
  }
}

/**
 * Usage Limit Management Service Extension
 * 
 * Provides comprehensive usage limit management with automatic resets,
 * alerting, and enforcement capabilities.
 */
export class UsageLimitManagementService extends ConfigurationService {

  /**
   * Increment usage counter and check limits
   */
  async incrementUsage(
    resourceType: string,
    schoolId?: string,
    amount: number = 1
  ): Promise<{
    newUsage: number
    limitValue: number
    isExceeded: boolean
    shouldAlert: boolean
    remainingUsage: number
  }> {
    try {
      const limit = await db.usageLimit.findFirst({
        where: {
          resourceType,
          schoolId: schoolId || null,
          isActive: true
        }
      })

      if (!limit) {
        // No limit configured - allow unlimited usage
        return {
          newUsage: amount,
          limitValue: Infinity,
          isExceeded: false,
          shouldAlert: false,
          remainingUsage: Infinity
        }
      }

      // Update usage counter
      const updated = await db.usageLimit.update({
        where: { id: limit.id },
        data: {
          currentUsage: {
            increment: amount
          }
        }
      })

      const newUsage = updated.currentUsage
      const isExceeded = newUsage >= limit.limitValue
      const usagePercentage = (newUsage / limit.limitValue) * 100
      const shouldAlert = limit.alertThreshold 
        ? usagePercentage >= limit.alertThreshold
        : false

      return {
        newUsage,
        limitValue: limit.limitValue,
        isExceeded,
        shouldAlert,
        remainingUsage: Math.max(0, limit.limitValue - newUsage)
      }
    } catch (error) {
      console.error('Failed to increment usage:', error)
      throw new Error('Failed to increment usage')
    }
  }

  /**
   * Reset usage counters based on reset period
   */
  async resetUsageCounters(): Promise<{
    resetCount: number
    errors: Array<{ limitId: string; error: string }>
  }> {
    try {
      const now = new Date()
      const limits = await db.usageLimit.findMany({
        where: { isActive: true }
      })

      let resetCount = 0
      const errors: Array<{ limitId: string; error: string }> = []

      for (const limit of limits) {
        try {
          const shouldReset = this.shouldResetUsage(limit, now)
          
          if (shouldReset) {
            await db.usageLimit.update({
              where: { id: limit.id },
              data: {
                currentUsage: 0,
                lastResetAt: now
              }
            })
            resetCount++
          }
        } catch (error) {
          errors.push({
            limitId: limit.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return { resetCount, errors }
    } catch (error) {
      console.error('Failed to reset usage counters:', error)
      throw new Error('Failed to reset usage counters')
    }
  }

  /**
   * Get usage analytics across all limits
   */
  async getUsageAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLimits: number
    activeLimits: number
    exceededLimits: number
    alertingLimits: number
    resourceBreakdown: Array<{
      resourceType: string
      totalLimits: number
      averageUsage: number
      maxUsage: number
      exceededCount: number
    }>
    schoolBreakdown: Array<{
      schoolId: string
      schoolName?: string
      totalLimits: number
      exceededLimits: number
      totalUsage: number
    }>
  }> {
    try {
      const limits = await db.usageLimit.findMany({
        where: {
          isActive: true,
          ...(startDate && endDate ? {
            updatedAt: {
              gte: startDate,
              lte: endDate
            }
          } : {})
        },
        include: {
          school: {
            select: { id: true, name: true }
          }
        }
      })

      const totalLimits = limits.length
      const activeLimits = limits.filter(l => l.isActive).length
      const exceededLimits = limits.filter(l => l.currentUsage >= l.limitValue).length
      const alertingLimits = limits.filter(l => {
        if (!l.alertThreshold) return false
        const percentage = (l.currentUsage / l.limitValue) * 100
        return percentage >= l.alertThreshold
      }).length

      // Resource breakdown
      const resourceMap = new Map<string, any>()
      for (const limit of limits) {
        if (!resourceMap.has(limit.resourceType)) {
          resourceMap.set(limit.resourceType, {
            resourceType: limit.resourceType,
            totalLimits: 0,
            totalUsage: 0,
            maxUsage: 0,
            exceededCount: 0
          })
        }

        const resource = resourceMap.get(limit.resourceType)!
        resource.totalLimits++
        resource.totalUsage += limit.currentUsage
        resource.maxUsage = Math.max(resource.maxUsage, limit.currentUsage)
        if (limit.currentUsage >= limit.limitValue) {
          resource.exceededCount++
        }
      }

      const resourceBreakdown = Array.from(resourceMap.values()).map(r => ({
        ...r,
        averageUsage: r.totalUsage / r.totalLimits
      }))

      // School breakdown
      const schoolMap = new Map<string, any>()
      for (const limit of limits) {
        const schoolId = limit.schoolId || 'global'
        if (!schoolMap.has(schoolId)) {
          schoolMap.set(schoolId, {
            schoolId,
            schoolName: limit.school?.name,
            totalLimits: 0,
            exceededLimits: 0,
            totalUsage: 0
          })
        }

        const school = schoolMap.get(schoolId)!
        school.totalLimits++
        school.totalUsage += limit.currentUsage
        if (limit.currentUsage >= limit.limitValue) {
          school.exceededLimits++
        }
      }

      const schoolBreakdown = Array.from(schoolMap.values())

      return {
        totalLimits,
        activeLimits,
        exceededLimits,
        alertingLimits,
        resourceBreakdown,
        schoolBreakdown
      }
    } catch (error) {
      console.error('Failed to get usage analytics:', error)
      throw new Error('Failed to get usage analytics')
    }
  }

  /**
   * Bulk update usage limits
   */
  async bulkUpdateUsageLimits(
    userId: string,
    updates: Array<{
      name: string
      schoolId?: string
      limitValue?: number
      alertThreshold?: number
      isActive?: boolean
    }>
  ): Promise<{
    successful: number
    failed: Array<{ name: string; schoolId?: string; error: string }>
  }> {
    let successful = 0
    const failed: Array<{ name: string; schoolId?: string; error: string }> = []

    for (const update of updates) {
      try {
        const limit = await db.usageLimit.findFirst({
          where: {
            name: update.name,
            schoolId: update.schoolId || null
          }
        })

        if (!limit) {
          failed.push({
            name: update.name,
            schoolId: update.schoolId,
            error: 'Usage limit not found'
          })
          continue
        }

        await db.usageLimit.update({
          where: { id: limit.id },
          data: {
            ...(update.limitValue !== undefined && { limitValue: update.limitValue }),
            ...(update.alertThreshold !== undefined && { alertThreshold: update.alertThreshold }),
            ...(update.isActive !== undefined && { isActive: update.isActive }),
            updatedBy: userId
          }
        })

        await this.logConfigurationChange(
          userId,
          limit.id,
          'USAGE_LIMIT',
          'UPDATE',
          {
            limitValue: limit.limitValue,
            alertThreshold: limit.alertThreshold,
            isActive: limit.isActive
          },
          update,
          'Bulk usage limit update'
        )

        successful++
      } catch (error) {
        failed.push({
          name: update.name,
          schoolId: update.schoolId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    await logSystemConfigAction(
      userId,
      'UPDATE',
      'bulk_usage_limit_update',
      { successful, failed: failed.length, updates: updates.length }
    )

    return { successful, failed }
  }

  /**
   * Check if usage should be reset based on reset period
   */
  private shouldResetUsage(limit: any, now: Date): boolean {
    if (!limit.lastResetAt) return true

    const lastReset = new Date(limit.lastResetAt)
    const timeDiff = now.getTime() - lastReset.getTime()

    switch (limit.resetPeriod) {
      case 'DAILY':
        return timeDiff >= 24 * 60 * 60 * 1000 // 24 hours

      case 'WEEKLY':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay() + (limit.resetDay || 0))
        weekStart.setHours(0, 0, 0, 0)
        return lastReset < weekStart

      case 'MONTHLY':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), limit.resetDay || 1)
        return lastReset < monthStart

      case 'YEARLY':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        return lastReset < yearStart

      default:
        return false
    }
  }

  /**
   * Get usage limits that need alerts
   */
  async getUsageLimitsNeedingAlerts(): Promise<Array<{
    id: string
    name: string
    resourceType: string
    schoolId?: string
    schoolName?: string
    currentUsage: number
    limitValue: number
    usagePercentage: number
    alertThreshold: number
  }>> {
    try {
      const limits = await db.usageLimit.findMany({
        where: {
          isActive: true,
          alertThreshold: { not: null }
        },
        include: {
          school: {
            select: { id: true, name: true }
          }
        }
      })

      return limits
        .filter(limit => {
          const usagePercentage = (limit.currentUsage / limit.limitValue) * 100
          return usagePercentage >= (limit.alertThreshold || 0)
        })
        .map(limit => ({
          id: limit.id,
          name: limit.name,
          resourceType: limit.resourceType,
          schoolId: limit.schoolId || undefined,
          schoolName: limit.school?.name,
          currentUsage: limit.currentUsage,
          limitValue: limit.limitValue,
          usagePercentage: (limit.currentUsage / limit.limitValue) * 100,
          alertThreshold: limit.alertThreshold!
        }))
    } catch (error) {
      console.error('Failed to get usage limits needing alerts:', error)
      throw new Error('Failed to get usage limits needing alerts')
    }
  }
}

// Export extended service instances
export const integrationManagementService = new IntegrationManagementService()
export const usageLimitManagementService = new UsageLimitManagementService()

// Environment-specific configuration utilities (Requirement 7.6)

/**
 * Environment Configuration Manager
 * 
 * Provides utilities for managing configurations across different environments
 * with proper isolation and deployment support.
 */
export class EnvironmentConfigurationManager {
  
  /**
   * Copy configuration from one environment to another
   */
  async copyEnvironmentConfiguration(
    userId: string,
    sourceEnvironment: string,
    targetEnvironment: string,
    configTypes: Array<'SYSTEM_CONFIG' | 'FEATURE_FLAG' | 'INTEGRATION'> = ['SYSTEM_CONFIG', 'FEATURE_FLAG', 'INTEGRATION']
  ): Promise<{
    copied: number
    skipped: number
    errors: Array<{ type: string; key: string; error: string }>
  }> {
    let copied = 0
    let skipped = 0
    const errors: Array<{ type: string; key: string; error: string }> = []

    try {
      // Copy system configurations
      if (configTypes.includes('SYSTEM_CONFIG')) {
        const sourceConfigs = await db.systemConfiguration.findMany({
          where: { environment: sourceEnvironment, isActive: true }
        })

        for (const config of sourceConfigs) {
          try {
            const existing = await db.systemConfiguration.findFirst({
              where: {
                key: config.key,
                environment: targetEnvironment
              }
            })

            if (existing) {
              skipped++
              continue
            }

            await db.systemConfiguration.create({
              data: {
                key: config.key,
                value: config.value,
                description: config.description,
                category: config.category,
                environment: targetEnvironment,
                requiresRestart: config.requiresRestart,
                validationSchema: config.validationSchema,
                metadata: config.metadata,
                createdBy: userId
              }
            })

            copied++
          } catch (error) {
            errors.push({
              type: 'SYSTEM_CONFIG',
              key: config.key,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      // Copy feature flags
      if (configTypes.includes('FEATURE_FLAG')) {
        const sourceFlags = await db.featureFlag.findMany({
          where: { environment: sourceEnvironment }
        })

        for (const flag of sourceFlags) {
          try {
            const existing = await db.featureFlag.findFirst({
              where: {
                name: flag.name,
                environment: targetEnvironment
              }
            })

            if (existing) {
              skipped++
              continue
            }

            await db.featureFlag.create({
              data: {
                name: flag.name,
                description: flag.description,
                isEnabled: false, // Start disabled in new environment
                rolloutPercentage: 0,
                rolloutStrategy: flag.rolloutStrategy,
                targetUsers: flag.targetUsers,
                targetSchools: flag.targetSchools,
                conditions: flag.conditions,
                environment: targetEnvironment,
                startDate: flag.startDate,
                endDate: flag.endDate,
                createdBy: userId
              }
            })

            copied++
          } catch (error) {
            errors.push({
              type: 'FEATURE_FLAG',
              key: flag.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      // Copy integration configurations
      if (configTypes.includes('INTEGRATION')) {
        const sourceIntegrations = await db.integrationConfiguration.findMany({
          where: { environment: sourceEnvironment, isActive: true }
        })

        for (const integration of sourceIntegrations) {
          try {
            const existing = await db.integrationConfiguration.findFirst({
              where: {
                serviceName: integration.serviceName,
                environment: targetEnvironment
              }
            })

            if (existing) {
              skipped++
              continue
            }

            await db.integrationConfiguration.create({
              data: {
                serviceName: integration.serviceName,
                environment: targetEnvironment,
                isActive: false, // Start inactive in new environment
                configuration: integration.configuration,
                testConfiguration: integration.testConfiguration,
                webhookUrl: integration.webhookUrl,
                webhookSecret: integration.webhookSecret,
                rateLimits: integration.rateLimits,
                healthCheckUrl: integration.healthCheckUrl,
                metadata: integration.metadata,
                createdBy: userId
              }
            })

            copied++
          } catch (error) {
            errors.push({
              type: 'INTEGRATION',
              key: integration.serviceName,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      await logSystemConfigAction(
        userId,
        'CREATE',
        'environment_configuration_copy',
        {
          sourceEnvironment,
          targetEnvironment,
          configTypes,
          copied,
          skipped,
          errors: errors.length
        }
      )

      return { copied, skipped, errors }
    } catch (error) {
      console.error('Failed to copy environment configuration:', error)
      throw new Error('Failed to copy environment configuration')
    }
  }

  /**
   * Validate environment configuration consistency
   */
  async validateEnvironmentConfiguration(environment: string): Promise<{
    isValid: boolean
    issues: Array<{
      type: 'MISSING_CONFIG' | 'INVALID_VALUE' | 'INACTIVE_INTEGRATION' | 'EXPIRED_FLAG'
      severity: 'ERROR' | 'WARNING' | 'INFO'
      message: string
      details?: any
    }>
  }> {
    const issues: Array<{
      type: 'MISSING_CONFIG' | 'INVALID_VALUE' | 'INACTIVE_INTEGRATION' | 'EXPIRED_FLAG'
      severity: 'ERROR' | 'WARNING' | 'INFO'
      message: string
      details?: any
    }> = []

    try {
      // Check for required system configurations
      const requiredConfigs = [
        'database_url',
        'jwt_secret',
        'encryption_key'
      ]

      for (const configKey of requiredConfigs) {
        const config = await db.systemConfiguration.findFirst({
          where: {
            key: configKey,
            environment,
            isActive: true
          }
        })

        if (!config) {
          issues.push({
            type: 'MISSING_CONFIG',
            severity: 'ERROR',
            message: `Required configuration '${configKey}' is missing for environment '${environment}'`,
            details: { configKey, environment }
          })
        }
      }

      // Check for inactive critical integrations
      const criticalIntegrations = ['stripe', 'email_service']
      
      for (const serviceName of criticalIntegrations) {
        const integration = await db.integrationConfiguration.findFirst({
          where: {
            serviceName,
            environment,
            isActive: true
          }
        })

        if (!integration) {
          issues.push({
            type: 'INACTIVE_INTEGRATION',
            severity: 'WARNING',
            message: `Critical integration '${serviceName}' is not active in environment '${environment}'`,
            details: { serviceName, environment }
          })
        }
      }

      // Check for expired feature flags
      const now = new Date()
      const expiredFlags = await db.featureFlag.findMany({
        where: {
          environment,
          isEnabled: true,
          endDate: {
            lt: now
          }
        }
      })

      for (const flag of expiredFlags) {
        issues.push({
          type: 'EXPIRED_FLAG',
          severity: 'INFO',
          message: `Feature flag '${flag.name}' has expired but is still enabled`,
          details: { flagName: flag.name, endDate: flag.endDate }
        })
      }

      const isValid = !issues.some(issue => issue.severity === 'ERROR')

      return { isValid, issues }
    } catch (error) {
      console.error('Failed to validate environment configuration:', error)
      return {
        isValid: false,
        issues: [{
          type: 'INVALID_VALUE',
          severity: 'ERROR',
          message: 'Failed to validate environment configuration',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }]
      }
    }
  }

  /**
   * Get environment configuration summary
   */
  async getEnvironmentSummary(environment: string): Promise<{
    systemConfigurations: number
    featureFlags: {
      total: number
      enabled: number
      disabled: number
    }
    integrations: {
      total: number
      active: number
      healthy: number
      unhealthy: number
    }
    usageLimits: {
      global: number
      perSchool: number
      exceeded: number
    }
  }> {
    try {
      const [
        systemConfigCount,
        featureFlags,
        integrations,
        usageLimits
      ] = await Promise.all([
        db.systemConfiguration.count({
          where: { environment, isActive: true }
        }),
        db.featureFlag.findMany({
          where: { environment },
          select: { isEnabled: true }
        }),
        db.integrationConfiguration.findMany({
          where: { environment },
          select: { isActive: true, healthStatus: true }
        }),
        db.usageLimit.findMany({
          where: { isActive: true },
          select: { limitType: true, currentUsage: true, limitValue: true }
        })
      ])

      return {
        systemConfigurations: systemConfigCount,
        featureFlags: {
          total: featureFlags.length,
          enabled: featureFlags.filter(f => f.isEnabled).length,
          disabled: featureFlags.filter(f => !f.isEnabled).length
        },
        integrations: {
          total: integrations.length,
          active: integrations.filter(i => i.isActive).length,
          healthy: integrations.filter(i => i.healthStatus === 'HEALTHY').length,
          unhealthy: integrations.filter(i => i.healthStatus === 'UNHEALTHY').length
        },
        usageLimits: {
          global: usageLimits.filter(l => l.limitType === 'GLOBAL').length,
          perSchool: usageLimits.filter(l => l.limitType === 'PER_SCHOOL').length,
          exceeded: usageLimits.filter(l => l.currentUsage >= l.limitValue).length
        }
      }
    } catch (error) {
      console.error('Failed to get environment summary:', error)
      throw new Error('Failed to get environment summary')
    }
  }

  // External Integration Methods
  async getExternalIntegrations(): Promise<any[]> {
    try {
      return await db.integrationConfiguration.findMany({
        where: { isActive: true }
      });
    } catch (error) {
      console.error('Failed to get external integrations:', error);
      throw new Error('Failed to get external integrations');
    }
  }

  async getExternalIntegrationById(id: string): Promise<any> {
    try {
      return await db.integrationConfiguration.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Failed to get external integration:', error);
      throw new Error('Failed to get external integration');
    }
  }

  async createExternalIntegration(data: any): Promise<any> {
    try {
      return await db.integrationConfiguration.create({
        data: {
          ...data,
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (error) {
      console.error('Failed to create external integration:', error);
      throw new Error('Failed to create external integration');
    }
  }

  async updateExternalIntegration(id: string, data: any): Promise<any> {
    try {
      return await db.integrationConfiguration.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error('Failed to update external integration:', error);
      throw new Error('Failed to update external integration');
    }
  }

  async deleteExternalIntegration(id: string): Promise<void> {
    try {
      await db.integrationConfiguration.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Failed to delete external integration:', error);
      throw new Error('Failed to delete external integration');
    }
  }
}

// Export environment configuration manager
export const environmentConfigurationManager = new EnvironmentConfigurationManager()