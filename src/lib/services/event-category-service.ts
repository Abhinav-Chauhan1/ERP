/**
 * Event Category Service
 * 
 * Provides CRUD operations for calendar event categories.
 * 
 * Requirements: 8.1
 */

import { PrismaClient, CalendarEventCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Types for category creation and updates
export interface CreateEventCategoryInput {
  schoolId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateEventCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  order?: number;
}

// Validation errors
export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryValidationError';
  }
}

/**
 * Validates category data
 * Requirement 8.1: Require a unique category name and color code
 */
export function validateCategoryData(
  data: CreateEventCategoryInput | UpdateEventCategoryInput
): void {
  // For creation, check required fields
  if ('name' in data && 'color' in data) {
    const createData = data as CreateEventCategoryInput;
    
    if (!createData.name || createData.name.trim() === '') {
      throw new CategoryValidationError('Category name is required');
    }
    
    if (!createData.color || createData.color.trim() === '') {
      throw new CategoryValidationError('Category color is required');
    }
    
    // Validate color format (hex color)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(createData.color)) {
      throw new CategoryValidationError('Invalid color format. Use hex color code (e.g., #3b82f6)');
    }
  }
  
  // Validate color format if being updated
  if (data.color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(data.color)) {
      throw new CategoryValidationError('Invalid color format. Use hex color code (e.g., #3b82f6)');
    }
  }
}

/**
 * Creates a new event category
 */
export async function createEventCategory(
  data: CreateEventCategoryInput
): Promise<CalendarEventCategory> {
  // Validate input
  validateCategoryData(data);
  
  // Check for duplicate name (case-insensitive)
  const existing = await prisma.calendarEventCategory.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: 'insensitive'
      }
    }
  });
  
  if (existing) {
    throw new CategoryValidationError('A category with this name already exists');
  }
  
  // Create the category
  const category = await prisma.calendarEventCategory.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      school: {
        connect: { id: data.schoolId }
      }
    }
  });
  
  return category;
}

/**
 * Gets an event category by ID
 */
export async function getEventCategoryById(
  categoryId: string
): Promise<CalendarEventCategory | null> {
  return await prisma.calendarEventCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { events: true }
      }
    }
  });
}

/**
 * Gets all event categories
 */
export async function getAllEventCategories(
  includeInactive: boolean = false
): Promise<CalendarEventCategory[]> {
  const where = includeInactive ? {} : { isActive: true };
  
  return await prisma.calendarEventCategory.findMany({
    where,
    orderBy: [
      { order: 'asc' },
      { name: 'asc' }
    ],
    include: {
      _count: {
        select: { events: true }
      }
    }
  });
}

/**
 * Updates an event category
 */
export async function updateEventCategory(
  categoryId: string,
  data: UpdateEventCategoryInput
): Promise<CalendarEventCategory> {
  // Validate input
  validateCategoryData(data);
  
  // Check if category exists
  const existing = await getEventCategoryById(categoryId);
  if (!existing) {
    throw new CategoryValidationError('Category not found');
  }
  
  // Check for duplicate name if name is being updated
  if (data.name) {
    const duplicate = await prisma.calendarEventCategory.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive'
        },
        id: {
          not: categoryId
        }
      }
    });
    
    if (duplicate) {
      throw new CategoryValidationError('A category with this name already exists');
    }
  }
  
  // Update the category
  const updated = await prisma.calendarEventCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isActive: data.isActive,
      order: data.order
    }
  });
  
  return updated;
}

/**
 * Deletes an event category
 * Requirement 8.4: Require reassignment of existing events to another category
 */
export async function deleteEventCategory(
  categoryId: string,
  replacementCategoryId?: string
): Promise<void> {
  // Check if category exists
  const existing = await getEventCategoryById(categoryId);
  if (!existing) {
    throw new CategoryValidationError('Category not found');
  }
  
  // Check if category has events
  const eventCount = await prisma.calendarEvent.count({
    where: { categoryId }
  });
  
  if (eventCount > 0) {
    // Require replacement category
    if (!replacementCategoryId) {
      throw new CategoryValidationError(
        `Cannot delete category with ${eventCount} events. Please provide a replacement category.`
      );
    }
    
    // Verify replacement category exists
    const replacementCategory = await getEventCategoryById(replacementCategoryId);
    if (!replacementCategory) {
      throw new CategoryValidationError('Replacement category not found');
    }
    
    // Reassign all events to the replacement category
    await prisma.calendarEvent.updateMany({
      where: { categoryId },
      data: { categoryId: replacementCategoryId }
    });
  }
  
  // Delete the category
  await prisma.calendarEventCategory.delete({
    where: { id: categoryId }
  });
}

/**
 * Reorders event categories
 */
export async function reorderEventCategories(
  categoryOrders: Array<{ id: string; order: number }>
): Promise<void> {
  // Update each category's order
  await Promise.all(
    categoryOrders.map(({ id, order }) =>
      prisma.calendarEventCategory.update({
        where: { id },
        data: { order }
      })
    )
  );
}

/**
 * Gets categories by name (case-insensitive search)
 */
export async function searchEventCategories(
  searchTerm: string
): Promise<CalendarEventCategory[]> {
  return await prisma.calendarEventCategory.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    orderBy: [
      { order: 'asc' },
      { name: 'asc' }
    ]
  });
}
