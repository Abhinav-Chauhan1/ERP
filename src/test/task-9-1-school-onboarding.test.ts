/**
 * Test for Task 9.1: Update school creation to set isOnboarded flag to false
 * Requirements: 9.1
 * 
 * This test verifies that when a school is created, the isOnboarded flag is set to false
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { prisma as db } from '@/lib/db';
import { schoolService } from '@/lib/services/school-service';
import { PlanType, SchoolStatus } from '@prisma/client';

describe('Task 9.1: School Creation with isOnboarded Flag', () => {
  let createdSchoolIds: string[] = [];

  afterAll(async () => {
    // Cleanup created schools
    if (createdSchoolIds.length > 0) {
      await db.school.deleteMany({
        where: {
          id: {
            in: createdSchoolIds
          }
        }
      });
    }
  });

  test('should set isOnboarded to false when creating a school via schoolService.createSchool', async () => {
    const schoolData = {
      name: 'Test School for Onboarding',
      schoolCode: `TEST_ONBOARD_${Date.now()}`,
      email: 'test@onboarding.com',
      plan: PlanType.STARTER
    };

    const school = await schoolService.createSchool(schoolData);
    createdSchoolIds.push(school.id);

    expect(school.isOnboarded).toBe(false);
    expect(school.onboardingStep).toBe(0);
  });

  test('should set isOnboarded to false when creating a school via schoolService.createSchoolWithSaasConfig', async () => {
    const schoolData = {
      name: 'Test SaaS School for Onboarding',
      schoolCode: `SAAS_ONBOARD_${Date.now()}`,
      subdomain: `saas-test-${Date.now()}`,
      email: 'saas@onboarding.com',
      plan: PlanType.GROWTH,
      status: SchoolStatus.INACTIVE
    };

    const school = await schoolService.createSchoolWithSaasConfig(schoolData);
    createdSchoolIds.push(school.id);

    expect(school.isOnboarded).toBe(false);
    expect(school.onboardingStep).toBe(0);
  });

  test('should set isOnboarded to false when creating a school directly via Prisma', async () => {
    const schoolData = {
      name: 'Direct Prisma School',
      schoolCode: `PRISMA_ONBOARD_${Date.now()}`,
      email: 'prisma@onboarding.com',
      plan: PlanType.STARTER,
      status: SchoolStatus.ACTIVE
    };

    const school = await db.school.create({
      data: schoolData
    });
    createdSchoolIds.push(school.id);

    // Should use the default value from the schema
    expect(school.isOnboarded).toBe(false);
    expect(school.onboardingStep).toBe(0);
  });

  test('should allow explicit setting of isOnboarded to false', async () => {
    const schoolData = {
      name: 'Explicit False School',
      schoolCode: `EXPLICIT_FALSE_${Date.now()}`,
      email: 'explicit@onboarding.com',
      plan: PlanType.STARTER,
      status: SchoolStatus.ACTIVE,
      isOnboarded: false,
      onboardingStep: 0
    };

    const school = await db.school.create({
      data: schoolData
    });
    createdSchoolIds.push(school.id);

    expect(school.isOnboarded).toBe(false);
    expect(school.onboardingStep).toBe(0);
  });

  test('should verify that all school creation paths result in isOnboarded = false', async () => {
    // Test multiple creation scenarios
    const scenarios = [
      {
        name: 'Scenario 1: Basic School',
        data: {
          name: 'Basic Test School',
          schoolCode: `BASIC_${Date.now()}`,
          email: 'basic@test.com'
        }
      },
      {
        name: 'Scenario 2: School with Plan',
        data: {
          name: 'Plan Test School',
          schoolCode: `PLAN_${Date.now()}`,
          email: 'plan@test.com',
          plan: PlanType.GROWTH
        }
      },
      {
        name: 'Scenario 3: School with Subdomain',
        data: {
          name: 'Subdomain Test School',
          schoolCode: `SUBDOMAIN_${Date.now()}`,
          subdomain: `subdomain-test-${Date.now()}`,
          email: 'subdomain@test.com',
          plan: PlanType.DOMINATE
        }
      }
    ];

    for (const scenario of scenarios) {
      const school = await db.school.create({
        data: scenario.data
      });
      createdSchoolIds.push(school.id);

      expect(school.isOnboarded).toBe(false);
      expect(school.onboardingStep).toBe(0);
    }
  });
});