/**
 * Safely extracts the ID from route parameters
 * Works with both sync and async params
 */
export function getRouteId(params: any): string {
  if (!params) {
    console.error('Missing params object');
    return '';
  }
  
  if (params && typeof params === 'object') {
    // Handle both Promise-like and regular objects
    if ('id' in params) {
      const id = params.id;
      if (typeof id !== 'string' || !id) {
        console.error('Invalid ID in params:', id);
        return '';
      }
      return id;
    }
  }
  
  // Fallback for unexpected cases
  console.error('Invalid route params:', params);
  return '';
}
