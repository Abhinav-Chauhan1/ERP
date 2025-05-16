/**
 * Format time for display (HH:MM format)
 */
export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Format day for display (e.g., "MONDAY" → "Monday")
 */
export function formatDayForDisplay(day: string): string {
  return day.charAt(0) + day.slice(1).toLowerCase();
}
