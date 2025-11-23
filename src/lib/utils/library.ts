/**
 * Library utility functions
 */

/**
 * Calculate overdue fine for a book return
 * @param issueDate - Date when the book was issued
 * @param dueDate - Date when the book was due
 * @param returnDate - Date when the book was returned
 * @param dailyRate - Daily fine rate (default: 5)
 * @returns Fine amount
 */
export function calculateOverdueFine(
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  dailyRate: number = 5
): number {
  const dueDateObj = new Date(dueDate);
  const returnDateObj = new Date(returnDate);

  // If returned on or before due date, no fine
  if (returnDateObj <= dueDateObj) {
    return 0;
  }

  // Calculate days overdue
  const daysOverdue = Math.ceil(
    (returnDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysOverdue * dailyRate;
}

/**
 * Check if a book issue is overdue
 * @param dueDate - Date when the book was due
 * @param currentDate - Current date (default: now)
 * @returns True if overdue, false otherwise
 */
export function isBookOverdue(dueDate: Date, currentDate: Date = new Date()): boolean {
  const dueDateObj = new Date(dueDate);
  const currentDateObj = new Date(currentDate);
  
  // Set time to start of day for comparison
  dueDateObj.setHours(0, 0, 0, 0);
  currentDateObj.setHours(0, 0, 0, 0);
  
  return currentDateObj > dueDateObj;
}

/**
 * Calculate days overdue
 * @param dueDate - Date when the book was due
 * @param currentDate - Current date (default: now)
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(dueDate: Date, currentDate: Date = new Date()): number {
  const dueDateObj = new Date(dueDate);
  const currentDateObj = new Date(currentDate);
  
  // Set time to start of day for comparison
  dueDateObj.setHours(0, 0, 0, 0);
  currentDateObj.setHours(0, 0, 0, 0);
  
  if (currentDateObj <= dueDateObj) {
    return 0;
  }
  
  return Math.ceil(
    (currentDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
}
