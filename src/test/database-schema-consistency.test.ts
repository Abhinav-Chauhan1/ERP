/**
 * Property-Based Tests for Database Schema Consistency
 * 
 * Tests database schema integrity and consistency for super-admin SaaS completion
 * Feature: super-admin-saas-completion, Property 1: Database schema integrity
 * Validates: Requirements 1.1, 2.1, 4.1
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data generators for better reusability
const generators = {
  schoolData: () => fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }),
    code: fc.string({ minLength: 3, maxLength: 10 })
  }),
  
  userData: () => fc.record({
    email: fc.emailAddress(),
    firstName: fc.string({ minLength: 2, maxLength: 30 }),
    lastName: fc.string({ minLength: 2, maxLength: 30 })
  }),
  
  subscriptionData: () => fc.record({
    planId: fc.constantFrom('starter-monthly', 'growth-monthly', 'dominate-monthly'),
    status: fc.constantFrom('ACTIVE', 'TRIALING', 'PAST_DUE')
  }),
  
  auditData: () => fc.record({
    action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'),
    resource: fc.constantFrom('school', 'subscription', 'invoice', 'payment', 'user'),
    resourceId: fc.string({ minLength: 10, maxLength: 30 }),
    ipAddress: fc.ipV4(),
    userAgent: fc.string({ minLength: 10, maxLength: 100 })
  })
};

// Test fixtures for common operations
class TestFixtures {
  static async createTestSchool(data: { name: string; code: string }) {
    return await prisma.school.create({
      data: {
        name: data.name,
        schoolCode: `TEST_${data.code}_${Date.now()}`,
        plan: 'STARTER',
        status: 'ACTIVE'
      }
    });
  }

  static async createTestUser(data: { email: string; firstName: string; lastName: string }, role = 'ADMIN') {
    return await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: role as any,
        active: true
      }
    });
  }

  static async cleanupTestData(resources: {
    schoolIds?: string[];
    userIds?: string[];
    subscriptionIds?: string[];
  }) {
    const { schoolIds = [], userIds = [], subscriptionIds = [] } = resources;

    // Clean up in correct order to maintain referential integrity
    if (subscriptionIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { subscriptionId: { in: subscriptionIds } }
      });
      await prisma.invoice.deleteMany({
        where: { subscriptionId: { in: subscriptionIds } }
      });
      await prisma.enhancedSubscription.deleteMany({
        where: { id: { in: subscriptionIds } }
      });
    }

    if (schoolIds.length > 0) {
      await prisma.analyticsEvent.deleteMany({
        where: { schoolId: { in: schoolIds } }
      });
      await prisma.supportTicket.deleteMany({
        where: { schoolId: { in: schoolIds } }
      });
      await prisma.enhancedSubscription.deleteMany({
        where: { schoolId: { in: schoolIds } }
      });
    }

    if (userIds.length > 0) {
      await prisma.knowledgeBaseArticle.deleteMany({
        where: { authorId: { in: userIds } }
      });
      await prisma.auditLog.deleteMany({
        where: { userId: { in: userIds } }
      });
    }

    // Delete main entities last
    if (schoolIds.length > 0) {
      await prisma.school.deleteMany({
        where: { id: { in: schoolIds } }
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  }
}

describe('Database Schema Consistency', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
    
    // Verify required subscription plans exist
    const requiredPlans = ['starter-monthly', 'growth-monthly', 'dominate-monthly'];
    for (const planId of requiredPlans) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new Error(`Required subscription plan '${planId}' not found. Run seed script first.`);
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Property 1: Database Schema Integrity', () => {
    it('should maintain referential integrity across all enhanced billing models', async () => {
      // Feature: super-admin-saas-completion, Property 1: Database schema integrity
      // Validates: Requirements 1.1, 2.1, 4.1
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            schoolData: generators.schoolData(),
            subscriptionData: generators.subscriptionData(),
            invoiceAmount: fc.integer({ min: 1000, max: 50000 }), // in cents
            paymentAmount: fc.integer({ min: 1000, max: 50000 })
          }),
          async (testData) => {
            const createdResources: { schoolIds: string[]; subscriptionIds: string[] } = {
              schoolIds: [],
              subscriptionIds: []
            };

            try {
              // Create test school
              const school = await TestFixtures.createTestSchool(testData.schoolData);
              createdResources.schoolIds.push(school.id);

              // Verify subscription plan exists (should be guaranteed by beforeAll)
              const plan = await prisma.subscriptionPlan.findUnique({
                where: { id: testData.subscriptionData.planId }
              });
              expect(plan).toBeDefined();
              expect(plan?.isActive).toBe(true);

              // Create enhanced subscription
              const subscription = await prisma.enhancedSubscription.create({
                data: {
                  schoolId: school.id,
                  planId: testData.subscriptionData.planId,
                  status: testData.subscriptionData.status,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  metadata: {
                    testData: true,
                    createdBy: 'property-test'
                  }
                }
              });
              createdResources.subscriptionIds.push(subscription.id);

              // Verify subscription relationships
              expect(subscription.schoolId).toBe(school.id);
              expect(subscription.planId).toBe(testData.subscriptionData.planId);
              expect(subscription.status).toBe(testData.subscriptionData.status);

              // Create invoice and payment
              const invoice = await prisma.invoice.create({
                data: {
                  subscriptionId: subscription.id,
                  amount: testData.invoiceAmount,
                  currency: 'usd',
                  status: 'OPEN',
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  metadata: { testData: true }
                }
              });

              const payment = await prisma.payment.create({
                data: {
                  subscriptionId: subscription.id,
                  invoiceId: invoice.id,
                  amount: testData.paymentAmount,
                  currency: 'usd',
                  status: 'COMPLETED',
                  processedAt: new Date(),
                  paymentMethod: 'credit_card'
                }
              });

              // Verify relationships through cascade queries
              const subscriptionWithRelations = await prisma.enhancedSubscription.findUnique({
                where: { id: subscription.id },
                include: {
                  school: true,
                  plan: true,
                  invoices: true,
                  payments: true
                }
              });

              expect(subscriptionWithRelations).toBeDefined();
              expect(subscriptionWithRelations?.school.id).toBe(school.id);
              expect(subscriptionWithRelations?.plan.id).toBe(testData.subscriptionData.planId);
              expect(subscriptionWithRelations?.invoices).toHaveLength(1);
              expect(subscriptionWithRelations?.payments).toHaveLength(1);

              // Verify invoice relationships
              const invoiceWithPayments = await prisma.invoice.findUnique({
                where: { id: invoice.id },
                include: {
                  payments: true,
                  subscription: { include: { school: true } }
                }
              });

              expect(invoiceWithPayments).toBeDefined();
              expect(invoiceWithPayments?.payments).toHaveLength(1);
              expect(invoiceWithPayments?.subscription.school.id).toBe(school.id);

            } finally {
              await TestFixtures.cleanupTestData(createdResources);
            }
          }
        ),
        { numRuns: 50 } // Reduced for better performance while maintaining coverage
      );
    }, 60000);

    it('should maintain audit log integrity and consistency', async () => {
      // Feature: super-admin-saas-completion, Property 1: Database schema integrity
      // Validates: Requirements 4.1
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'),
            resource: fc.constantFrom('school', 'subscription', 'invoice', 'payment', 'user'),
            resourceId: fc.string({ minLength: 10, maxLength: 30 }),
            ipAddress: fc.ipV4(),
            userAgent: fc.string({ minLength: 10, maxLength: 100 })
          }),
          async (testData) => {
            // Create a test user
            const user = await prisma.user.create({
              data: {
                email: testData.userEmail,
                firstName: 'Test',
                lastName: 'User',
                role: 'SUPER_ADMIN',
                active: true
              }
            });

            try {
              // Create audit log entry
              const auditLog = await prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: testData.action,
                  resource: testData.resource,
                  resourceId: testData.resourceId,
                  changes: {
                    testData: true,
                    timestamp: new Date().toISOString()
                  },
                  ipAddress: testData.ipAddress,
                  userAgent: testData.userAgent,
                  checksum: `checksum_${Date.now()}`
                }
              });

              // Verify audit log was created correctly
              expect(auditLog.userId).toBe(user.id);
              expect(auditLog.action).toBe(testData.action);
              expect(auditLog.resource).toBe(testData.resource);
              expect(auditLog.resourceId).toBe(testData.resourceId);
              expect(auditLog.ipAddress).toBe(testData.ipAddress);
              expect(auditLog.userAgent).toBe(testData.userAgent);
              expect(auditLog.checksum).toBeDefined();

              // Verify audit log can be queried with relationships
              const auditLogWithUser = await prisma.auditLog.findUnique({
                where: { id: auditLog.id },
                include: {
                  user: true
                }
              });

              expect(auditLogWithUser).toBeDefined();
              expect(auditLogWithUser?.user.id).toBe(user.id);
              expect(auditLogWithUser?.user.email).toBe(testData.userEmail);

              // Verify audit log filtering works
              const auditLogs = await prisma.auditLog.findMany({
                where: {
                  userId: user.id,
                  action: testData.action,
                  resource: testData.resource
                }
              });

              expect(auditLogs).toHaveLength(1);
              expect(auditLogs[0].id).toBe(auditLog.id);

            } finally {
              // Cleanup test data
              await prisma.auditLog.deleteMany({
                where: { userId: user.id }
              });
              await prisma.user.delete({
                where: { id: user.id }
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 45000);

    it('should maintain analytics events and support system integrity', async () => {
      // Feature: super-admin-saas-completion, Property 1: Database schema integrity
      // Validates: Requirements 2.1, 10.1
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            schoolName: fc.string({ minLength: 3, maxLength: 50 }),
            schoolCode: fc.string({ minLength: 3, maxLength: 10 }),
            userEmail: fc.emailAddress(),
            eventType: fc.constantFrom('user_login', 'payment_processed', 'report_generated', 'message_sent'),
            ticketTitle: fc.string({ minLength: 10, maxLength: 100 }),
            ticketDescription: fc.string({ minLength: 20, maxLength: 500 }),
            ticketPriority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            articleTitle: fc.string({ minLength: 10, maxLength: 100 }),
            articleCategory: fc.constantFrom('Account Management', 'Integrations', 'Reports', 'Finance')
          }),
          async (testData) => {
            // Create test school and user
            const school = await prisma.school.create({
              data: {
                name: testData.schoolName,
                schoolCode: `TEST_${testData.schoolCode}_${Date.now()}`,
                plan: 'STARTER',
                status: 'ACTIVE'
              }
            });

            const user = await prisma.user.create({
              data: {
                email: testData.userEmail,
                firstName: 'Test',
                lastName: 'User',
                role: 'ADMIN',
                active: true
              }
            });

            try {
              // Create analytics event
              const analyticsEvent = await prisma.analyticsEvent.create({
                data: {
                  eventType: testData.eventType,
                  schoolId: school.id,
                  userId: user.id,
                  properties: {
                    testData: true,
                    source: 'property-test',
                    timestamp: new Date().toISOString()
                  }
                }
              });

              // Verify analytics event relationships
              expect(analyticsEvent.eventType).toBe(testData.eventType);
              expect(analyticsEvent.schoolId).toBe(school.id);
              expect(analyticsEvent.userId).toBe(user.id);

              // Create support ticket
              const supportTicket = await prisma.supportTicket.create({
                data: {
                  ticketNumber: `TEST-${Date.now()}`,
                  schoolId: school.id,
                  title: testData.ticketTitle,
                  description: testData.ticketDescription,
                  status: 'OPEN',
                  priority: testData.ticketPriority,
                  createdBy: user.id,
                  metadata: {
                    testData: true
                  }
                }
              });

              // Verify support ticket relationships
              expect(supportTicket.schoolId).toBe(school.id);
              expect(supportTicket.createdBy).toBe(user.id);
              expect(supportTicket.title).toBe(testData.ticketTitle);
              expect(supportTicket.priority).toBe(testData.ticketPriority);

              // Create knowledge base article
              const kbArticle = await prisma.knowledgeBaseArticle.create({
                data: {
                  title: testData.articleTitle,
                  content: 'Test content for property-based testing',
                  category: testData.articleCategory,
                  tags: ['test', 'property-based'],
                  isPublished: true,
                  authorId: user.id,
                  viewCount: 0
                }
              });

              // Verify knowledge base article relationships
              expect(kbArticle.title).toBe(testData.articleTitle);
              expect(kbArticle.category).toBe(testData.articleCategory);
              expect(kbArticle.authorId).toBe(user.id);

              // Test complex queries with relationships
              const ticketWithRelations = await prisma.supportTicket.findUnique({
                where: { id: supportTicket.id },
                include: {
                  school: true,
                  creator: true,
                  comments: true
                }
              });

              expect(ticketWithRelations).toBeDefined();
              expect(ticketWithRelations?.school.id).toBe(school.id);
              expect(ticketWithRelations?.creator.id).toBe(user.id);

              const analyticsWithRelations = await prisma.analyticsEvent.findUnique({
                where: { id: analyticsEvent.id },
                include: {
                  school: true,
                  user: true
                }
              });

              expect(analyticsWithRelations).toBeDefined();
              expect(analyticsWithRelations?.school?.id).toBe(school.id);
              expect(analyticsWithRelations?.user?.id).toBe(user.id);

            } finally {
              // Cleanup test data
              await prisma.knowledgeBaseArticle.deleteMany({
                where: { authorId: user.id }
              });
              await prisma.supportTicket.deleteMany({
                where: { schoolId: school.id }
              });
              await prisma.analyticsEvent.deleteMany({
                where: { schoolId: school.id }
              });
              await prisma.user.delete({
                where: { id: user.id }
              });
              await prisma.school.delete({
                where: { id: school.id }
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 45000);

    it('should maintain data consistency across all enhanced models', async () => {
      // Feature: super-admin-saas-completion, Property 1: Database schema integrity
      // Validates: Requirements 1.1, 2.1, 4.1, 10.1
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            schoolData: fc.record({
              name: fc.string({ minLength: 3, maxLength: 50 }),
              code: fc.string({ minLength: 3, maxLength: 10 })
            }),
            userData: fc.record({
              email: fc.emailAddress(),
              firstName: fc.string({ minLength: 2, maxLength: 30 }),
              lastName: fc.string({ minLength: 2, maxLength: 30 })
            }),
            subscriptionData: fc.record({
              planId: fc.constantFrom('starter-monthly', 'growth-monthly'),
              status: fc.constantFrom('ACTIVE', 'TRIALING')
            })
          }),
          async (testData) => {
            // Create interconnected test data
            const school = await prisma.school.create({
              data: {
                name: testData.schoolData.name,
                schoolCode: `TEST_${testData.schoolData.code}_${Date.now()}`,
                plan: 'STARTER',
                status: 'ACTIVE'
              }
            });

            const user = await prisma.user.create({
              data: {
                email: testData.userData.email,
                firstName: testData.userData.firstName,
                lastName: testData.userData.lastName,
                role: 'SUPER_ADMIN',
                active: true
              }
            });

            try {
              // Create subscription
              const subscription = await prisma.enhancedSubscription.create({
                data: {
                  schoolId: school.id,
                  planId: testData.subscriptionData.planId,
                  status: testData.subscriptionData.status,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              });

              // Create audit log for subscription creation
              const auditLog = await prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: 'CREATE',
                  resource: 'subscription',
                  resourceId: subscription.id,
                  changes: {
                    schoolId: school.id,
                    planId: testData.subscriptionData.planId,
                    status: testData.subscriptionData.status
                  },
                  checksum: `checksum_${Date.now()}`
                }
              });

              // Create analytics event for subscription
              const analyticsEvent = await prisma.analyticsEvent.create({
                data: {
                  eventType: 'subscription_created',
                  schoolId: school.id,
                  userId: user.id,
                  properties: {
                    subscriptionId: subscription.id,
                    planId: testData.subscriptionData.planId,
                    status: testData.subscriptionData.status
                  }
                }
              });

              // Verify all relationships are consistent
              const schoolWithRelations = await prisma.school.findUnique({
                where: { id: school.id },
                include: {
                  enhancedSubscriptions: true,
                  analyticsEvents: true,
                  supportTickets: true
                }
              });

              expect(schoolWithRelations).toBeDefined();
              expect(schoolWithRelations?.enhancedSubscriptions).toHaveLength(1);
              expect(schoolWithRelations?.analyticsEvents).toHaveLength(1);
              expect(schoolWithRelations?.enhancedSubscriptions[0].id).toBe(subscription.id);
              expect(schoolWithRelations?.analyticsEvents[0].id).toBe(analyticsEvent.id);

              // Verify user relationships
              const userWithRelations = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                  auditLogs: true,
                  analyticsEvents: true
                }
              });

              expect(userWithRelations).toBeDefined();
              expect(userWithRelations?.auditLogs).toHaveLength(1);
              expect(userWithRelations?.analyticsEvents).toHaveLength(1);
              expect(userWithRelations?.auditLogs[0].id).toBe(auditLog.id);
              expect(userWithRelations?.analyticsEvents[0].id).toBe(analyticsEvent.id);

            } finally {
              // Cleanup in correct order to maintain referential integrity
              await prisma.analyticsEvent.deleteMany({
                where: { schoolId: school.id }
              });
              await prisma.auditLog.deleteMany({
                where: { userId: user.id }
              });
              await prisma.enhancedSubscription.deleteMany({
                where: { schoolId: school.id }
              });
              await prisma.user.delete({
                where: { id: user.id }
              });
              await prisma.school.delete({
                where: { id: school.id }
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 45000);
  });
});