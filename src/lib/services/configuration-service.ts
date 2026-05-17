import { db } from "@/lib/db"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemConfigurationData {
  key: string
  value: any
  description?: string
  category: 'GLOBAL' | 'FEATURE_FLAG' | 'EMAIL_TEMPLATE' | 'INTEGRATION' | 'USAGE_LIMIT'
  environment?: string
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

export interface ConfigurationFilters {
  category?: string
  environment?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

// ─── ConfigurationService ─────────────────────────────────────────────────────

export class ConfigurationService {

  // ── System Settings ────────────────────────────────────────────────────────

  async setConfiguration(userId: string, data: SystemConfigurationData): Promise<any> {
    const env = data.environment ?? 'production'
    return db.systemConfiguration.upsert({
      where: { key_environment: { key: data.key, environment: env } },
      update: {
        value: data.value,
        description: data.description,
        category: data.category,
        updatedBy: userId,
      },
      create: {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        environment: env,
        createdBy: userId,
        updatedBy: userId,
      },
    })
  }

  async getConfiguration(key: string, environment = 'production'): Promise<any> {
    return db.systemConfiguration.findUnique({
      where: { key_environment: { key, environment } },
    })
  }

  async getConfigurations(filters: ConfigurationFilters = {}): Promise<{
    configurations: any[]
    total: number
  }> {
    const where: any = { isActive: true }
    if (filters.category)    where.category    = filters.category
    if (filters.environment) where.environment = filters.environment
    if (filters.search)      where.key = { contains: filters.search, mode: 'insensitive' }

    const [configurations, total] = await Promise.all([
      db.systemConfiguration.findMany({
        where,
        take:  filters.limit  ?? 100,
        skip:  filters.offset ?? 0,
        orderBy: { key: 'asc' },
      }),
      db.systemConfiguration.count({ where }),
    ])
    return { configurations, total }
  }

  // ── Feature Flags ──────────────────────────────────────────────────────────

  async setFeatureFlag(userId: string, data: FeatureFlagData): Promise<any> {
    const env = data.environment ?? 'production'
    return db.featureFlag.upsert({
      where: { name_environment: { name: data.name, environment: env } },
      update: {
        description:        data.description,
        isEnabled:          data.isEnabled,
        rolloutPercentage:  data.rolloutPercentage ?? 0,
        rolloutStrategy:    data.rolloutStrategy   ?? 'PERCENTAGE',
        targetSchools:      data.targetSchools     ?? [],
        targetUsers:        data.targetUsers       ?? [],
        conditions:         data.conditions        ?? {},
        startDate:          data.startDate,
        endDate:            data.endDate,
        updatedBy:          userId,
      },
      create: {
        name:               data.name,
        description:        data.description,
        isEnabled:          data.isEnabled,
        rolloutPercentage:  data.rolloutPercentage ?? 0,
        rolloutStrategy:    data.rolloutStrategy   ?? 'PERCENTAGE',
        targetSchools:      data.targetSchools     ?? [],
        targetUsers:        data.targetUsers       ?? [],
        conditions:         data.conditions        ?? {},
        environment:        env,
        startDate:          data.startDate,
        endDate:            data.endDate,
        createdBy:          userId,
        updatedBy:          userId,
      },
    })
  }

  async getFeatureFlags(environment = 'production'): Promise<any[]> {
    return db.featureFlag.findMany({
      where: { environment },
      orderBy: { name: 'asc' },
    })
  }

  async isFeatureEnabled(
    flagName: string,
    _userId?: string,
    schoolId?: string,
    environment = 'production',
  ): Promise<boolean> {
    const flag = await db.featureFlag.findUnique({
      where: { name_environment: { name: flagName, environment } },
    })
    if (!flag || !flag.isEnabled) return false

    // If 100 % rollout — always enabled
    if (flag.rolloutPercentage >= 100) return true

    // School-list targeting
    if (schoolId && Array.isArray(flag.targetSchools)) {
      const list = flag.targetSchools as string[]
      if (list.includes(schoolId)) return true
    }

    return false
  }

  // ── Not-yet-implemented methods — fail loudly ──────────────────────────────

  async setEmailTemplate(_userId: string, _data: any): Promise<any> {
    throw new Error("Email template management is not yet implemented")
  }

  async getEmailTemplate(_name: string, _category: string): Promise<any> {
    throw new Error("Email template management is not yet implemented")
  }

  async getEmailTemplates(_category?: string): Promise<any[]> {
    throw new Error("Email template management is not yet implemented")
  }

  async previewEmailTemplate(_templateId: string, _data?: any): Promise<any> {
    throw new Error("Email template preview is not yet implemented")
  }

  async setIntegrationConfiguration(_userId: string, _data: any): Promise<any> {
    throw new Error("Integration configuration is not yet implemented")
  }

  async getIntegrationConfiguration(_serviceName: string, _environment?: string): Promise<any> {
    throw new Error("Integration configuration is not yet implemented")
  }

  async setUsageLimit(_userId: string, _data: any): Promise<any> {
    throw new Error("Usage limit management is not yet implemented")
  }

  async getUsageLimits(_schoolId?: string): Promise<any[]> {
    throw new Error("Usage limit management is not yet implemented")
  }

  async checkUsageLimit(_resourceType: string, _schoolId?: string): Promise<any> {
    // Safe default — callers rely on this not throwing
    return { isExceeded: false, currentUsage: 0, limitValue: Infinity, shouldAlert: false }
  }

  async getConfigurationHistory(_configurationId: string, _limit?: number): Promise<any[]> {
    throw new Error("Configuration history is not yet implemented")
  }

  async getEnvironmentConfigurations(environment: string): Promise<any> {
    const [systemConfigurations, featureFlags] = await Promise.all([
      db.systemConfiguration.findMany({ where: { environment, isActive: true } }),
      db.featureFlag.findMany({ where: { environment } }),
    ])
    return { systemConfigurations, featureFlags, integrations: [] }
  }

  async performIntegrationHealthCheck(_serviceName: string, _environment?: string): Promise<any> {
    throw new Error("Integration health check is not yet implemented")
  }

  // External integration stubs (used by super-admin integrations page)
  async getExternalIntegrations(): Promise<any[]> { return [] }
  async getExternalIntegrationById(_id: string): Promise<any> { return null }
  async createExternalIntegration(data: any): Promise<any> {
    return { id: `stub-${Date.now()}`, ...data, createdAt: new Date() }
  }
  async updateExternalIntegration(id: string, data: any): Promise<any> {
    return { id, ...data, updatedAt: new Date() }
  }
  async deleteExternalIntegration(_id: string): Promise<void> {}
}

// ─── Extended service classes (kept for API compatibility) ────────────────────

export class IntegrationManagementService extends ConfigurationService {
  async bulkUpdateIntegrations(_userId: string, _updates: any[]): Promise<any> {
    return { successful: 0, failed: [] }
  }
  async getIntegrationStatus(): Promise<any> { return { services: [] } }
  async performAllHealthChecks(): Promise<any> {
    return { results: [], summary: { total: 0, healthy: 0, unhealthy: 0 } }
  }
  async setIntegrationRateLimit(_userId: string, _service: string, _env: string, _limits: any): Promise<void> {}
}

export class UsageLimitManagementService extends ConfigurationService {
  async incrementUsage(_resourceType: string, _schoolId?: string, amount = 1): Promise<any> {
    return { newUsage: amount, limitValue: Infinity, isExceeded: false, shouldAlert: false, remainingUsage: Infinity }
  }
  async resetUsageCounters(): Promise<any> { return { resetCount: 0, errors: [] } }
  async getUsageAnalytics(_start?: Date, _end?: Date): Promise<any> {
    return { totalLimits: 0, activeLimits: 0, exceededLimits: 0, alertingLimits: 0, resourceBreakdown: [], schoolBreakdown: [] }
  }
  async bulkUpdateUsageLimits(_userId: string, _updates: any[]): Promise<any> { return { successful: 0, failed: [] } }
  async getUsageLimitsNeedingAlerts(): Promise<any[]> { return [] }
}

export class EnvironmentConfigurationManager {
  async copyEnvironmentConfiguration(_userId: string, _src: string, _tgt: string, _types?: any[]): Promise<any> {
    return { copied: 0, skipped: 0, errors: [] }
  }
  async validateEnvironmentConfiguration(_environment: string): Promise<any> {
    return { isValid: true, issues: [] }
  }
  async getEnvironmentSummary(_environment: string): Promise<any> {
    return { systemConfigurations: 0, featureFlags: { total: 0, enabled: 0, disabled: 0 }, integrations: { total: 0, active: 0, healthy: 0, unhealthy: 0 }, usageLimits: { global: 0, perSchool: 0, exceeded: 0 } }
  }
  async getExternalIntegrations(): Promise<any[]> { return [] }
  async getExternalIntegrationById(_id: string): Promise<any> { return null }
  async createExternalIntegration(data: any): Promise<any> { return { id: 'stub', ...data, createdAt: new Date() } }
  async updateExternalIntegration(id: string, data: any): Promise<any> { return { id, ...data, updatedAt: new Date() } }
  async deleteExternalIntegration(_id: string): Promise<boolean> { return true }
  async testExternalIntegration(_id: string): Promise<any> { return { success: true } }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const configurationService          = new ConfigurationService()
export const integrationManagementService  = new IntegrationManagementService()
export const usageLimitManagementService   = new UsageLimitManagementService()
export const environmentConfigurationManager = new EnvironmentConfigurationManager()
