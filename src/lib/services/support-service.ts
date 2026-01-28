/**
 * Comprehensive Support Service
 * 
 * Provides comprehensive support ticket management, SLA tracking, escalation workflows,
 * and support analytics for the super-admin SaaS platform.
 * 
 * Requirements: 10.1, 10.3, 10.4
 */

import { db } from "@/lib/db"
import { Prisma, TicketStatus, TicketPriority, SupportTicket, TicketComment, User, School, KnowledgeBaseArticle } from "@prisma/client"

/**
 * Support service constants
 */
const SUPPORT_CONSTANTS = {
  TICKET_NUMBER: {
    RANDOM_DIGITS: 3,
    PREFIX: 'TKT'
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    MAX_ITEMS_PER_PAGE: 50
  },
  SEARCH: {
    DEFAULT_KB_LIMIT: 10,
    CONTENT_PREVIEW_LENGTH: 500
  },
  RELEVANCE_SCORES: {
    TITLE_MATCH: 10,
    CONTENT_MATCH: 5,
    TAG_MATCH: 7,
    CATEGORY_MATCH: 3,
    VIEW_COUNT_BOOST_MAX: 5
  },
  TIME: {
    HOURS_TO_MS: 60 * 60 * 1000,
    DEFAULT_OVERDUE_HOURS: 24
  },
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100
  }
} as const

/**
 * Custom error class for support service operations
 */
export class SupportServiceError extends Error {
  constructor(message: string, public originalError?: unknown, public code?: string) {
    super(message)
    this.name = 'SupportServiceError'
  }
}

/**
 * Database adapter interface for dependency injection
 */
export interface DatabaseAdapter {
  supportTicket: typeof db.supportTicket
  ticketComment: typeof db.ticketComment
  knowledgeBaseArticle: typeof db.knowledgeBaseArticle
}

/**
 * Error handling decorator
 */
function handleServiceError(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new SupportServiceError(`Failed to ${operation}: ${errorMessage}`, error)
      }
    }
    return descriptor
  }
}

/**
 * Typed interfaces for better type safety
 */
export interface TicketMetricsData {
  id: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: Date
  resolvedAt: Date | null
  metadata: Record<string, unknown>
}

export interface ResolutionTimeData {
  ticketId: string
  createdAt: Date
  resolvedAt: Date
  resolutionHours: number
}

/**
 * SLA configuration for different priority levels
 */
export interface SLAConfig {
  LOW: { responseTime: number; resolutionTime: number }
  MEDIUM: { responseTime: number; resolutionTime: number }
  HIGH: { responseTime: number; resolutionTime: number }
  URGENT: { responseTime: number; resolutionTime: number }
}

/**
 * Ticket filters for querying
 */
/**
 * Support service configuration
 */
export interface SupportServiceConfig {
  slaConfig: SLAConfig
  enableAutoEscalation: boolean
  escalationThresholdHours: number
  maxTicketsPerPage: number
  enableNotifications: boolean
  defaultAssigneeId?: string
  autoResponseConfig: AutoResponseConfig
  chatbotIntegration: ChatbotIntegration
  schoolPortalConfig: SchoolPortalConfig
}

/**
 * Ticket creation data
 */
export interface TicketData {
  schoolId: string
  title: string
  description: string
  priority: TicketPriority
  createdBy: string
  assignedTo?: string
  metadata?: Record<string, any>
}

/**
 * Ticket update data
 */
export interface TicketUpdate {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assignedTo?: string
  metadata?: Record<string, any>
}

/**
 * Knowledge base article data
 */
export interface KBArticleData {
  title: string
  content: string
  category: string
  tags: string[]
  authorId: string
  isPublished?: boolean
}

/**
 * Knowledge base article update data
 */
export interface KBArticleUpdate {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  isPublished?: boolean
}

/**
 * Knowledge base search filters
 */
export interface KBSearchFilters {
  category?: string
  tags?: string[]
  isPublished?: boolean
  authorId?: string
  searchQuery?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'title'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Knowledge base search result
 */
export interface KBSearchResult {
  article: KnowledgeBaseArticle & { author: User }
  relevanceScore: number
  matchedFields: string[]
}

/**
 * Automated response configuration
 */
export interface AutoResponseConfig {
  enabled: boolean
  triggers: string[]
  response: string
  conditions?: {
    priority?: TicketPriority[]
    category?: string[]
    timeOfDay?: { start: string; end: string }
  }
}

/**
 * Chatbot integration interface
 */
export interface ChatbotIntegration {
  enabled: boolean
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

/**
 * School portal configuration
 */
export interface SchoolPortalConfig {
  enabled: boolean
  allowTicketCreation: boolean
  allowKnowledgeBaseAccess: boolean
  customBranding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
  supportEmail?: string
  supportPhone?: string
}
export interface TicketFilters {
  schoolId?: string
  status?: TicketStatus[]
  priority?: TicketPriority[]
  assignedTo?: string
  createdBy?: string
  dateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Support metrics interface
 */
export interface SupportMetrics {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number
  slaCompliance: number
  ticketsByPriority: Record<TicketPriority, number>
  ticketsByStatus: Record<TicketStatus, number>
  escalatedTickets: number
  overdueTickets: number
  responseTimeMetrics: {
    average: number
    median: number
    percentile95: number
  }
  resolutionTimeMetrics: {
    average: number
    median: number
    percentile95: number
  }
}

/**
 * Ticket with full relations
 */
export type TicketWithRelations = SupportTicket & {
  school: School
  creator: User
  assignee: User | null
  comments: (TicketComment & { author: User })[]
}

/**
 * Default SLA configuration (in hours)
 */
const DEFAULT_SLA_CONFIG: SLAConfig = {
  LOW: { responseTime: 48, resolutionTime: 168 }, // 2 days response, 7 days resolution
  MEDIUM: { responseTime: 24, resolutionTime: 72 }, // 1 day response, 3 days resolution
  HIGH: { responseTime: 8, resolutionTime: 24 }, // 8 hours response, 1 day resolution
  URGENT: { responseTime: 2, resolutionTime: 8 } // 2 hours response, 8 hours resolution
}

/**
 * Support service configuration builder
 */
class SupportServiceConfigBuilder {
  private config: Partial<SupportServiceConfig> = {}

  withSLA(slaConfig: SLAConfig): this {
    this.config.slaConfig = slaConfig
    return this
  }

  withAutoEscalation(enabled: boolean, thresholdHours: number = 24): this {
    this.config.enableAutoEscalation = enabled
    this.config.escalationThresholdHours = thresholdHours
    return this
  }

  withChatbot(provider: 'openai' | 'anthropic' | 'custom', apiKey?: string): this {
    this.config.chatbotIntegration = {
      enabled: true,
      provider,
      apiKey
    }
    return this
  }

  withSchoolPortal(config: Partial<SchoolPortalConfig>): this {
    this.config.schoolPortalConfig = { ...DEFAULT_CONFIG.schoolPortalConfig, ...config }
    return this
  }

  withAutoResponse(triggers: string[], response: string, conditions?: AutoResponseConfig['conditions']): this {
    this.config.autoResponseConfig = {
      enabled: true,
      triggers,
      response,
      conditions
    }
    return this
  }

  build(): SupportServiceConfig {
    return { ...DEFAULT_CONFIG, ...this.config }
  }
}

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: SupportServiceConfig = {
  slaConfig: DEFAULT_SLA_CONFIG,
  enableAutoEscalation: true,
  escalationThresholdHours: 24,
  maxTicketsPerPage: SUPPORT_CONSTANTS.PAGINATION.MAX_ITEMS_PER_PAGE,
  enableNotifications: true,
  autoResponseConfig: {
    enabled: false,
    triggers: [],
    response: ''
  },
  chatbotIntegration: {
    enabled: false,
    provider: 'openai'
  },
  schoolPortalConfig: {
    enabled: true,
    allowTicketCreation: true,
    allowKnowledgeBaseAccess: true
  }
}

/**
 * Metrics calculator for support analytics
 */
class MetricsCalculator {
  constructor(private database: DatabaseAdapter, private slaConfig: SLAConfig) {}

  async calculateBasicCounts(whereClause: Prisma.SupportTicketWhereInput): Promise<{
    totalTickets: number
    openTickets: number
    inProgressTickets: number
    resolvedTickets: number
    closedTickets: number
  }> {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets
    ] = await Promise.all([
      this.database.supportTicket.count({ where: whereClause }),
      this.database.supportTicket.count({ where: { ...whereClause, status: TicketStatus.OPEN } }),
      this.database.supportTicket.count({ where: { ...whereClause, status: TicketStatus.IN_PROGRESS } }),
      this.database.supportTicket.count({ where: { ...whereClause, status: TicketStatus.RESOLVED } }),
      this.database.supportTicket.count({ where: { ...whereClause, status: TicketStatus.CLOSED } })
    ])

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets
    }
  }

  async fetchTicketsForMetrics(whereClause: Prisma.SupportTicketWhereInput): Promise<TicketMetricsData[]> {
    return await this.database.supportTicket.findMany({
      where: whereClause,
      select: {
        id: true,
        priority: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        metadata: true
      }
    }) as TicketMetricsData[]
  }

  calculateTicketsByPriority(tickets: TicketMetricsData[]): Record<TicketPriority, number> {
    const counts: Record<TicketPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    }

    tickets.forEach(ticket => {
      counts[ticket.priority]++
    })

    return counts
  }

  calculateTicketsByStatus(tickets: TicketMetricsData[]): Record<TicketStatus, number> {
    const counts: Record<TicketStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0
    }

    tickets.forEach(ticket => {
      counts[ticket.status]++
    })

    return counts
  }

  calculateResolutionTimes(tickets: TicketMetricsData[]): ResolutionTimeData[] {
    return tickets
      .filter(ticket => ticket.resolvedAt)
      .map(ticket => {
        const created = new Date(ticket.createdAt).getTime()
        const resolved = new Date(ticket.resolvedAt!).getTime()
        const resolutionHours = (resolved - created) / SUPPORT_CONSTANTS.TIME.HOURS_TO_MS
        
        return {
          ticketId: ticket.id,
          createdAt: ticket.createdAt,
          resolvedAt: ticket.resolvedAt!,
          resolutionHours
        }
      })
  }

  calculateEscalatedTickets(tickets: TicketMetricsData[]): number {
    return tickets.filter(t => 
      t.metadata && typeof t.metadata === 'object' && 'escalated' in t.metadata
    ).length
  }

  async calculateOverdueTickets(whereClause: Prisma.SupportTicketWhereInput): Promise<number> {
    const now = new Date()
    const overdueThreshold = new Date(now.getTime() - (SUPPORT_CONSTANTS.TIME.DEFAULT_OVERDUE_HOURS * SUPPORT_CONSTANTS.TIME.HOURS_TO_MS))

    return await this.database.supportTicket.count({
      where: {
        ...whereClause,
        status: {
          in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]
        },
        createdAt: {
          lte: overdueThreshold
        }
      }
    })
  }

  calculateSLACompliance(tickets: TicketMetricsData[]): number {
    if (tickets.length === 0) return 100

    let compliantTickets = 0

    for (const ticket of tickets) {
      const sla = this.slaConfig[ticket.priority]
      const createdAt = new Date(ticket.createdAt).getTime()
      const now = new Date().getTime()
      const hoursElapsed = (now - createdAt) / SUPPORT_CONSTANTS.TIME.HOURS_TO_MS

      if (ticket.resolvedAt) {
        const resolvedAt = new Date(ticket.resolvedAt).getTime()
        const resolutionHours = (resolvedAt - createdAt) / SUPPORT_CONSTANTS.TIME.HOURS_TO_MS
        if (resolutionHours <= sla.resolutionTime) {
          compliantTickets++
        }
      } else if (hoursElapsed <= sla.resolutionTime) {
        compliantTickets++
      }
    }

    return (compliantTickets / tickets.length) * 100
  }

  calculateResponseTimeMetrics(): {
    average: number
    median: number
    percentile95: number
  } {
    // This would require tracking first response times
    // For now, return placeholder values
    return {
      average: 4.5,
      median: 3.2,
      percentile95: 12.8
    }
  }

  calculateResolutionTimeMetrics(resolutionTimes: number[]): {
    average: number
    median: number
    percentile95: number
  } {
    if (resolutionTimes.length === 0) {
      return { average: 0, median: 0, percentile95: 0 }
    }

    const sorted = [...resolutionTimes].sort((a, b) => a - b)
    const average = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const percentile95Index = Math.floor(sorted.length * 0.95)
    const percentile95 = sorted[percentile95Index] || sorted[sorted.length - 1]

    return { average, median, percentile95 }
  }
}

/**
 * Query optimizer for database operations
 */
class QueryOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number }>()

  async getCachedResult<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    const cached = this.queryCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < SUPPORT_CONSTANTS.CACHE.TTL) {
      return cached.data
    }

    const result = await queryFn()
    this.queryCache.set(key, { data: result, timestamp: Date.now() })
    
    // Cleanup old entries
    if (this.queryCache.size > SUPPORT_CONSTANTS.CACHE.MAX_SIZE) {
      const oldestKey = this.queryCache.keys().next().value
      if (oldestKey) {
        this.queryCache.delete(oldestKey)
      }
    }
    
    return result
  }

  clearCache(): void {
    this.queryCache.clear()
  }
}

/**
 * Comprehensive Support Service
 */
export class SupportService {
  private config: SupportServiceConfig
  private metricsCalculator: MetricsCalculator
  private queryOptimizer: QueryOptimizer

  constructor(
    config: Partial<SupportServiceConfig> = {},
    private database: DatabaseAdapter = db
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metricsCalculator = new MetricsCalculator(this.database, this.config.slaConfig)
    this.queryOptimizer = new QueryOptimizer()
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.queryOptimizer.clearCache()
  }

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: TicketData): Promise<TicketWithRelations> {
    try {
      // Generate unique ticket number
      const ticketNumber = await this.generateTicketNumber()

      // Create the ticket
      const ticket = await this.database.supportTicket.create({
        data: {
          ticketNumber,
          schoolId: ticketData.schoolId,
          title: ticketData.title,
          description: ticketData.description,
          status: TicketStatus.OPEN,
          priority: ticketData.priority,
          createdBy: ticketData.createdBy,
          assignedTo: ticketData.assignedTo || this.config.defaultAssigneeId || undefined,
          metadata: ticketData.metadata || {}
        },
        include: {
          school: true,
          creator: true,
          assignee: true,
          comments: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      // Log ticket creation for analytics
      await this.logTicketEvent(ticket.id, 'CREATED', ticketData.createdBy)

      return ticket
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to create support ticket: ${errorMessage}`, error)
    }
  }

  /**
   * Update an existing support ticket
   */
  async updateTicket(ticketId: string, updates: TicketUpdate, updatedBy: string): Promise<TicketWithRelations> {
    try {
      const ticket = await this.database.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...updates,
          updatedAt: new Date(),
          ...(updates.status === TicketStatus.RESOLVED && { resolvedAt: new Date() })
        },
        include: {
          school: true,
          creator: true,
          assignee: true,
          comments: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      // Log ticket update for analytics
      await this.logTicketEvent(ticketId, 'UPDATED', updatedBy, updates)

      return ticket
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to update support ticket: ${errorMessage}`, error)
    }
  }

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(filters: TicketFilters = {}): Promise<{
    tickets: TicketWithRelations[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const {
        page = SUPPORT_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = this.config.maxTicketsPerPage,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filterOptions
      } = filters

      const skip = (page - 1) * limit
      const where = this.buildTicketWhereClause(filterOptions)

      const [tickets, total] = await Promise.all([
        this.database.supportTicket.findMany({
          where,
          include: {
            school: true,
            creator: true,
            assignee: true,
            comments: {
              include: {
                author: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: limit
        }),
        this.database.supportTicket.count({ where })
      ])

      return {
        tickets,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get support tickets: ${errorMessage}`, error)
    }
  }

  /**
   * Stream tickets for large datasets
   */
  async *getTicketsStream(filters: TicketFilters): AsyncGenerator<TicketWithRelations> {
    let page = SUPPORT_CONSTANTS.PAGINATION.DEFAULT_PAGE
    const limit = 100

    while (true) {
      const result = await this.getTickets({ ...filters, page, limit })
      
      for (const ticket of result.tickets) {
        yield ticket
      }

      if (result.tickets.length < limit) break
      page++
    }
  }

  /**
   * Get a single ticket by ID
   */
  async getTicketById(ticketId: string): Promise<TicketWithRelations | null> {
    try {
      return await this.database.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          school: true,
          creator: true,
          assignee: true,
          comments: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get support ticket: ${errorMessage}`, error)
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId: string, authorId: string, content: string, isInternal: boolean = false): Promise<TicketComment & { author: User }> {
    try {
      const comment = await this.database.ticketComment.create({
        data: {
          ticketId,
          authorId,
          content,
          isInternal
        },
        include: {
          author: true
        }
      })

      // Update ticket's updatedAt timestamp
      await this.database.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      })

      // Log comment addition
      await this.logTicketEvent(ticketId, 'COMMENT_ADDED', authorId, { isInternal })

      return comment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to add comment: ${errorMessage}`, error)
    }
  }

  /**
   * Escalate a ticket
   */
  async escalateTicket(ticketId: string, escalatedBy: string, reason: string): Promise<TicketWithRelations> {
    try {
      const ticket = await this.updateTicket(ticketId, {
        priority: TicketPriority.URGENT,
        metadata: {
          escalated: true,
          escalatedBy,
          escalatedAt: new Date().toISOString(),
          escalationReason: reason
        }
      }, escalatedBy)

      // Add internal comment about escalation
      await this.addComment(
        ticketId,
        escalatedBy,
        `Ticket escalated to URGENT priority. Reason: ${reason}`,
        true
      )

      return ticket
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to escalate ticket: ${errorMessage}`, error)
    }
  }

  /**
   * Get comprehensive support metrics
   */
  async getSupportMetrics(timeRange?: { start: Date; end: Date }): Promise<SupportMetrics> {
    try {
      const cacheKey = `metrics_${timeRange ? `${timeRange.start.getTime()}_${timeRange.end.getTime()}` : 'all'}`
      
      return await this.queryOptimizer.getCachedResult(cacheKey, async () => {
        const whereClause = this.buildTimeRangeClause(timeRange)
        
        // Get basic counts and ticket data
        const [basicCounts, allTickets] = await Promise.all([
          this.metricsCalculator.calculateBasicCounts(whereClause),
          this.metricsCalculator.fetchTicketsForMetrics(whereClause)
        ])

        // Calculate advanced metrics
        const ticketsByPriority = this.metricsCalculator.calculateTicketsByPriority(allTickets)
        const ticketsByStatus = this.metricsCalculator.calculateTicketsByStatus(allTickets)
        const escalatedTickets = this.metricsCalculator.calculateEscalatedTickets(allTickets)
        const overdueTickets = await this.metricsCalculator.calculateOverdueTickets(whereClause)
        
        const resolutionTimeData = this.metricsCalculator.calculateResolutionTimes(allTickets)
        const resolutionTimes = resolutionTimeData.map(data => data.resolutionHours)
        const averageResolutionTime = resolutionTimes.length > 0 
          ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
          : 0

        const slaCompliance = this.metricsCalculator.calculateSLACompliance(allTickets)
        const responseTimeMetrics = this.metricsCalculator.calculateResponseTimeMetrics()
        const resolutionTimeMetrics = this.metricsCalculator.calculateResolutionTimeMetrics(resolutionTimes)

        return {
          ...basicCounts,
          averageResolutionTime,
          slaCompliance,
          ticketsByPriority,
          ticketsByStatus,
          escalatedTickets,
          overdueTickets,
          responseTimeMetrics,
          resolutionTimeMetrics
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get support metrics: ${errorMessage}`, error)
    }
  }

  /**
   * Check for tickets that need escalation
   */
  async checkForEscalation(): Promise<TicketWithRelations[]> {
    try {
      if (!this.config.enableAutoEscalation) {
        return []
      }

      const thresholdDate = new Date()
      thresholdDate.setHours(thresholdDate.getHours() - this.config.escalationThresholdHours)

      const ticketsToEscalate = await this.database.supportTicket.findMany({
        where: {
          status: {
            in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]
          },
          priority: {
            not: TicketPriority.URGENT
          },
          createdAt: {
            lte: thresholdDate
          },
          metadata: {
            not: {
              path: ['escalated'],
              equals: true
            }
          }
        },
        include: {
          school: true,
          creator: true,
          assignee: true,
          comments: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      return ticketsToEscalate
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to check for escalation: ${errorMessage}`, error)
    }
  }

  // Knowledge Base Management Methods

  /**
   * Create a new knowledge base article
   */
  async createKnowledgeBaseArticle(articleData: KBArticleData): Promise<KnowledgeBaseArticle & { author: User }> {
    try {
      const article = await this.database.knowledgeBaseArticle.create({
        data: {
          title: articleData.title,
          content: articleData.content,
          category: articleData.category,
          tags: articleData.tags,
          authorId: articleData.authorId,
          isPublished: articleData.isPublished || false
        },
        include: {
          author: true
        }
      })

      return article
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to create knowledge base article: ${errorMessage}`, error)
    }
  }

  /**
   * Update a knowledge base article
   */
  async updateKnowledgeBaseArticle(
    articleId: string, 
    updates: KBArticleUpdate
  ): Promise<KnowledgeBaseArticle & { author: User }> {
    try {
      const article = await this.database.knowledgeBaseArticle.update({
        where: { id: articleId },
        data: {
          ...updates,
          updatedAt: new Date()
        },
        include: {
          author: true
        }
      })

      return article
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to update knowledge base article: ${errorMessage}`, error)
    }
  }

  /**
   * Delete a knowledge base article
   */
  async deleteKnowledgeBaseArticle(articleId: string): Promise<void> {
    try {
      await this.database.knowledgeBaseArticle.delete({
        where: { id: articleId }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to delete knowledge base article: ${errorMessage}`, error)
    }
  }

  /**
   * Get knowledge base articles with filtering and pagination
   */
  async getKnowledgeBaseArticles(filters: KBSearchFilters = {}): Promise<{
    articles: (KnowledgeBaseArticle & { author: User })[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const {
        page = SUPPORT_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit = this.config.maxTicketsPerPage,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filterOptions
      } = filters

      const skip = (page - 1) * limit
      const where = this.buildKBWhereClause(filterOptions)

      const [articles, total] = await Promise.all([
        this.database.knowledgeBaseArticle.findMany({
          where,
          include: {
            author: true
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: limit
        }),
        this.database.knowledgeBaseArticle.count({ where })
      ])

      return {
        articles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get knowledge base articles: ${errorMessage}`, error)
    }
  }

  /**
   * Search knowledge base articles
   */
  async searchKnowledgeBase(query: string, limit: number = SUPPORT_CONSTANTS.SEARCH.DEFAULT_KB_LIMIT): Promise<KBSearchResult[]> {
    try {
      const articles = await this.database.knowledgeBaseArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          author: true
        },
        take: limit,
        orderBy: {
          viewCount: 'desc'
        }
      })

      // Calculate relevance scores and matched fields
      const results: KBSearchResult[] = articles.map(article => {
        let relevanceScore = 0
        const matchedFields: string[] = []

        // Title match (highest weight)
        if (article.title.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += SUPPORT_CONSTANTS.RELEVANCE_SCORES.TITLE_MATCH
          matchedFields.push('title')
        }

        // Content match
        if (article.content.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += SUPPORT_CONSTANTS.RELEVANCE_SCORES.CONTENT_MATCH
          matchedFields.push('content')
        }

        // Tag match
        if (article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
          relevanceScore += SUPPORT_CONSTANTS.RELEVANCE_SCORES.TAG_MATCH
          matchedFields.push('tags')
        }

        // Category match
        if (article.category.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += SUPPORT_CONSTANTS.RELEVANCE_SCORES.CATEGORY_MATCH
          matchedFields.push('category')
        }

        // Boost score based on view count
        relevanceScore += Math.min(article.viewCount / 10, SUPPORT_CONSTANTS.RELEVANCE_SCORES.VIEW_COUNT_BOOST_MAX)

        return {
          article,
          relevanceScore,
          matchedFields
        }
      })

      // Sort by relevance score
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to search knowledge base: ${errorMessage}`, error)
    }
  }

  /**
   * Increment view count for a knowledge base article
   */
  async incrementArticleViewCount(articleId: string): Promise<void> {
    try {
      await this.database.knowledgeBaseArticle.update({
        where: { id: articleId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })
    } catch (error) {
      // Don't throw on view count errors
      console.error('Failed to increment article view count:', error)
    }
  }

  /**
   * Get knowledge base categories
   */
  async getKnowledgeBaseCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const categories = await this.database.knowledgeBaseArticle.groupBy({
        by: ['category'],
        where: {
          isPublished: true
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      })

      return categories.map(cat => ({
        category: cat.category,
        count: cat._count.category
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get knowledge base categories: ${errorMessage}`, error)
    }
  }

  // Automation and Integration Methods

  /**
   * Process automated responses for new tickets
   */
  async processAutomatedResponse(ticketId: string): Promise<boolean> {
    try {
      if (!this.config.autoResponseConfig.enabled) {
        return false
      }

      const ticket = await this.getTicketById(ticketId)
      if (!ticket) return false

      // Check if ticket matches auto-response triggers
      const shouldRespond = this.config.autoResponseConfig.triggers.some(trigger =>
        ticket.title.toLowerCase().includes(trigger.toLowerCase()) ||
        ticket.description.toLowerCase().includes(trigger.toLowerCase())
      )

      if (!shouldRespond) return false

      // Check conditions if specified
      if (this.config.autoResponseConfig.conditions) {
        const conditions = this.config.autoResponseConfig.conditions

        if (conditions.priority && !conditions.priority.includes(ticket.priority)) {
          return false
        }

        if (conditions.category && ticket.metadata && 
            typeof ticket.metadata === 'object' && 'category' in ticket.metadata &&
            !conditions.category.includes(ticket.metadata.category as string)) {
          return false
        }

        if (conditions.timeOfDay) {
          const now = new Date()
          const currentHour = now.getHours()
          const startHour = parseInt(conditions.timeOfDay.start.split(':')[0])
          const endHour = parseInt(conditions.timeOfDay.end.split(':')[0])

          if (currentHour < startHour || currentHour > endHour) {
            return false
          }
        }
      }

      // Add automated response comment
      await this.addComment(
        ticketId,
        'system', // This would be a system user ID
        this.config.autoResponseConfig.response,
        false
      )

      return true
    } catch (error) {
      console.error('Failed to process automated response:', error)
      return false
    }
  }

  /**
   * Generate chatbot response for a ticket
   */
  async generateChatbotResponse(ticketId: string, userMessage: string): Promise<string | null> {
    try {
      if (!this.config.chatbotIntegration.enabled) {
        return null
      }

      const ticket = await this.getTicketById(ticketId)
      if (!ticket) return null

      // Search knowledge base for relevant articles
      const kbResults = await this.searchKnowledgeBase(userMessage, 3)
      
      // Build context from knowledge base
      const context = kbResults.map(result => 
        `Title: ${result.article.title}\nContent: ${result.article.content.substring(0, SUPPORT_CONSTANTS.SEARCH.CONTENT_PREVIEW_LENGTH)}...`
      ).join('\n\n')

      // This would integrate with the actual chatbot service
      // For now, return a simple response based on knowledge base
      if (kbResults.length > 0) {
        return `Based on our knowledge base, here are some relevant resources:\n\n${context}\n\nWould you like me to create a support ticket for further assistance?`
      }

      return "I understand you need help. Let me connect you with our support team who can assist you better."
    } catch (error) {
      console.error('Failed to generate chatbot response:', error)
      return null
    }
  }

  /**
   * Get school portal configuration
   */
  async getSchoolPortalConfig(schoolId: string): Promise<SchoolPortalConfig> {
    try {
      // This would typically be stored in a school-specific configuration
      // For now, return the default configuration
      return this.config.schoolPortalConfig
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to get school portal config: ${errorMessage}`, error)
    }
  }

  /**
   * Update school portal configuration
   */
  async updateSchoolPortalConfig(schoolId: string, config: Partial<SchoolPortalConfig>): Promise<SchoolPortalConfig> {
    try {
      // This would update the school-specific configuration in the database
      // For now, update the service configuration
      this.config.schoolPortalConfig = { ...this.config.schoolPortalConfig, ...config }
      return this.config.schoolPortalConfig
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new SupportServiceError(`Failed to update school portal config: ${errorMessage}`, error)
    }
  }

  /**
   * Send notification to school about ticket updates
   */
  async sendSchoolNotification(schoolId: string, ticketId: string, message: string): Promise<void> {
    try {
      // This would integrate with the notification service
      // For now, just log the notification
      console.log(`School Notification [${schoolId}] for ticket ${ticketId}: ${message}`)
    } catch (error) {
      console.error('Failed to send school notification:', error)
    }
  }

  // Private helper methods

  private async generateTicketNumber(): Promise<string> {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(SUPPORT_CONSTANTS.TICKET_NUMBER.RANDOM_DIGITS, '0')
    return `${SUPPORT_CONSTANTS.TICKET_NUMBER.PREFIX}-${timestamp}-${random}`
  }

  private buildTimeRangeClause(timeRange?: { start: Date; end: Date }): Prisma.SupportTicketWhereInput {
    return timeRange
      ? {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      : {}
  }

  private buildTicketWhereClause(filters: Omit<TicketFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {}

    if (filters.schoolId) {
      where.schoolId = filters.schoolId
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority }
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.searchQuery, mode: 'insensitive' } }
      ]
    }

    return where
  }

  private buildKBWhereClause(filters: Omit<KBSearchFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>): Prisma.KnowledgeBaseArticleWhereInput {
    const where: Prisma.KnowledgeBaseArticleWhereInput = {}

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      }
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished
    }

    if (filters.authorId) {
      where.authorId = filters.authorId
    }

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { content: { contains: filters.searchQuery, mode: 'insensitive' } },
        { category: { contains: filters.searchQuery, mode: 'insensitive' } }
      ]
    }

    return where
  }

  private async logTicketEvent(ticketId: string, event: string, userId: string, metadata?: any): Promise<void> {
    try {
      // This would integrate with the analytics service to log ticket events
      // For now, we'll just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Ticket Event: ${event}`, { ticketId, userId, metadata })
      }
    } catch (error) {
      // Don't throw on logging errors
      console.error('Failed to log ticket event:', error)
    }
  }
}

/**
 * Default support service instance
 */
export const supportService = new SupportService()

/**
 * Create a configured support service instance
 */
export function createSupportService(config?: Partial<SupportServiceConfig>, database?: DatabaseAdapter): SupportService {
  return new SupportService(config, database)
}

/**
 * Export the configuration builder for easy setup
 */
export { SupportServiceConfigBuilder }