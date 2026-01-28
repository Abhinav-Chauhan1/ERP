/**
 * Support Service Unit Tests
 * 
 * Tests the core functionality of the SupportService including ticket management,
 * knowledge base operations, and automation features.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SupportService } from '@/lib/services/support-service'
import { TicketPriority, TicketStatus } from '@prisma/client'
import { prisma as db } from '@/lib/db'

describe('SupportService', () => {
  let supportService: SupportService
  let testSchoolId: string
  let testUserId: string

  beforeEach(async () => {
    supportService = new SupportService()

    // Create test school
    const school = await db.school.create({
      data: {
        name: 'Test School',
        schoolCode: `TEST-${Date.now()}`
      }
    })
    testSchoolId = school.id

    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPER_ADMIN'
      }
    })
    testUserId = user.id
  })

  afterEach(async () => {
    // Clean up test data
    await db.ticketComment.deleteMany({
      where: {
        ticket: {
          schoolId: testSchoolId
        }
      }
    })
    
    await db.supportTicket.deleteMany({
      where: { schoolId: testSchoolId }
    })

    await db.knowledgeBaseArticle.deleteMany({
      where: { authorId: testUserId }
    })

    await db.user.delete({
      where: { id: testUserId }
    })

    await db.school.delete({
      where: { id: testSchoolId }
    })
  })

  describe('Ticket Management', () => {
    it('should create a support ticket successfully', async () => {
      const ticketData = {
        schoolId: testSchoolId,
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: TicketPriority.MEDIUM,
        createdBy: testUserId
      }

      const ticket = await supportService.createTicket(ticketData)

      expect(ticket).toBeDefined()
      expect(ticket.title).toBe(ticketData.title)
      expect(ticket.description).toBe(ticketData.description)
      expect(ticket.priority).toBe(ticketData.priority)
      expect(ticket.status).toBe(TicketStatus.OPEN)
      expect(ticket.schoolId).toBe(testSchoolId)
      expect(ticket.createdBy).toBe(testUserId)
      expect(ticket.ticketNumber).toMatch(/^TKT-\d+-\d{3}$/)
    })

    it('should update a support ticket successfully', async () => {
      // Create a ticket first
      const ticketData = {
        schoolId: testSchoolId,
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: TicketPriority.LOW,
        createdBy: testUserId
      }

      const createdTicket = await supportService.createTicket(ticketData)

      // Update the ticket
      const updates = {
        title: 'Updated Test Ticket',
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS
      }

      const updatedTicket = await supportService.updateTicket(createdTicket.id, updates, testUserId)

      expect(updatedTicket.title).toBe(updates.title)
      expect(updatedTicket.priority).toBe(updates.priority)
      expect(updatedTicket.status).toBe(updates.status)
    })

    it('should add comments to a ticket', async () => {
      // Create a ticket first
      const ticketData = {
        schoolId: testSchoolId,
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: TicketPriority.MEDIUM,
        createdBy: testUserId
      }

      const ticket = await supportService.createTicket(ticketData)

      // Add a comment
      const commentContent = 'This is a test comment'
      const comment = await supportService.addComment(ticket.id, testUserId, commentContent, false)

      expect(comment).toBeDefined()
      expect(comment.content).toBe(commentContent)
      expect(comment.authorId).toBe(testUserId)
      expect(comment.isInternal).toBe(false)
    })

    it('should get tickets with filtering', async () => {
      // Create multiple tickets
      const ticket1Data = {
        schoolId: testSchoolId,
        title: 'High Priority Ticket',
        description: 'This is urgent',
        priority: TicketPriority.HIGH,
        createdBy: testUserId
      }

      const ticket2Data = {
        schoolId: testSchoolId,
        title: 'Low Priority Ticket',
        description: 'This can wait',
        priority: TicketPriority.LOW,
        createdBy: testUserId
      }

      await supportService.createTicket(ticket1Data)
      await supportService.createTicket(ticket2Data)

      // Get tickets with priority filter
      const result = await supportService.getTickets({
        schoolId: testSchoolId,
        priority: [TicketPriority.HIGH]
      })

      expect(result.tickets).toHaveLength(1)
      expect(result.tickets[0].priority).toBe(TicketPriority.HIGH)
      expect(result.total).toBe(1)
    })
  })

  describe('Knowledge Base Management', () => {
    it('should create a knowledge base article successfully', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'This is a test knowledge base article with helpful information.',
        category: 'Testing',
        tags: ['test', 'example'],
        authorId: testUserId,
        isPublished: true
      }

      const article = await supportService.createKnowledgeBaseArticle(articleData)

      expect(article).toBeDefined()
      expect(article.title).toBe(articleData.title)
      expect(article.content).toBe(articleData.content)
      expect(article.category).toBe(articleData.category)
      expect(article.tags).toEqual(articleData.tags)
      expect(article.authorId).toBe(testUserId)
      expect(article.isPublished).toBe(true)
    })

    it('should search knowledge base articles', async () => {
      // Create test articles
      const article1Data = {
        title: 'How to Login',
        content: 'This article explains the login process for users.',
        category: 'Authentication',
        tags: ['login', 'auth'],
        authorId: testUserId,
        isPublished: true
      }

      const article2Data = {
        title: 'Password Reset',
        content: 'This article explains how to reset your password.',
        category: 'Authentication',
        tags: ['password', 'reset'],
        authorId: testUserId,
        isPublished: true
      }

      await supportService.createKnowledgeBaseArticle(article1Data)
      await supportService.createKnowledgeBaseArticle(article2Data)

      // Search for articles
      const results = await supportService.searchKnowledgeBase('login')

      expect(results).toHaveLength(1)
      expect(results[0].article.title).toBe('How to Login')
      expect(results[0].relevanceScore).toBeGreaterThan(0)
      expect(results[0].matchedFields).toContain('title')
    })

    it('should get knowledge base categories', async () => {
      // Create articles in different categories
      const article1Data = {
        title: 'Test Article 1',
        content: 'Content 1',
        category: 'Category A',
        tags: ['test'],
        authorId: testUserId,
        isPublished: true
      }

      const article2Data = {
        title: 'Test Article 2',
        content: 'Content 2',
        category: 'Category A',
        tags: ['test'],
        authorId: testUserId,
        isPublished: true
      }

      const article3Data = {
        title: 'Test Article 3',
        content: 'Content 3',
        category: 'Category B',
        tags: ['test'],
        authorId: testUserId,
        isPublished: true
      }

      await supportService.createKnowledgeBaseArticle(article1Data)
      await supportService.createKnowledgeBaseArticle(article2Data)
      await supportService.createKnowledgeBaseArticle(article3Data)

      const categories = await supportService.getKnowledgeBaseCategories()

      expect(categories).toHaveLength(2)
      expect(categories.find(c => c.category === 'Category A')?.count).toBe(2)
      expect(categories.find(c => c.category === 'Category B')?.count).toBe(1)
    })
  })

  describe('Support Metrics', () => {
    it('should calculate support metrics correctly', async () => {
      // Create tickets with different statuses and priorities
      const tickets = [
        {
          schoolId: testSchoolId,
          title: 'Open High Priority',
          description: 'Test',
          priority: TicketPriority.HIGH,
          createdBy: testUserId
        },
        {
          schoolId: testSchoolId,
          title: 'Resolved Medium Priority',
          description: 'Test',
          priority: TicketPriority.MEDIUM,
          createdBy: testUserId
        }
      ]

      const createdTickets = []
      for (const ticketData of tickets) {
        const ticket = await supportService.createTicket(ticketData)
        createdTickets.push(ticket)
      }

      // Resolve one ticket
      await supportService.updateTicket(
        createdTickets[1].id,
        { status: TicketStatus.RESOLVED },
        testUserId
      )

      const metrics = await supportService.getSupportMetrics()

      expect(metrics.totalTickets).toBe(2)
      expect(metrics.openTickets).toBe(1)
      expect(metrics.resolvedTickets).toBe(1)
      expect(metrics.ticketsByPriority.HIGH).toBe(1)
      expect(metrics.ticketsByPriority.MEDIUM).toBe(1)
      expect(metrics.ticketsByStatus.OPEN).toBe(1)
      expect(metrics.ticketsByStatus.RESOLVED).toBe(1)
    })
  })

  describe('Automation Features', () => {
    it('should process automated responses when enabled', async () => {
      // Configure auto-response
      const serviceWithAutoResponse = new SupportService({
        autoResponseConfig: {
          enabled: true,
          triggers: ['password', 'login'],
          response: 'Thank you for contacting support. We have received your request about login/password issues.'
        }
      })

      // Create a ticket that should trigger auto-response
      const ticketData = {
        schoolId: testSchoolId,
        title: 'Password Reset Issue',
        description: 'I cannot reset my password',
        priority: TicketPriority.MEDIUM,
        createdBy: testUserId
      }

      const ticket = await serviceWithAutoResponse.createTicket(ticketData)
      const responded = await serviceWithAutoResponse.processAutomatedResponse(ticket.id)

      expect(responded).toBe(true)

      // Check if comment was added
      const updatedTicket = await serviceWithAutoResponse.getTicketById(ticket.id)
      expect(updatedTicket?.comments).toHaveLength(1)
      expect(updatedTicket?.comments[0].content).toContain('Thank you for contacting support')
    })

    it('should not process automated responses when disabled', async () => {
      // Default service has auto-response disabled
      const ticketData = {
        schoolId: testSchoolId,
        title: 'Password Reset Issue',
        description: 'I cannot reset my password',
        priority: TicketPriority.MEDIUM,
        createdBy: testUserId
      }

      const ticket = await supportService.createTicket(ticketData)
      const responded = await supportService.processAutomatedResponse(ticket.id)

      expect(responded).toBe(false)
    })
  })
})