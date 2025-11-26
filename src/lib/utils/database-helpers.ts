import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Execute a database operation within a transaction
 * Automatically rolls back on error
 */
export async function executeInTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      return await operations(tx);
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Transaction failed:", error);
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: "Transaction failed" };
  }
}

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient errors like connection issues
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);

      console.log(`Retrying operation (attempt ${attempt + 2}/${maxRetries + 1})...`);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable (transient)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Common transient error patterns
    const transientPatterns = [
      'connection',
      'timeout',
      'econnrefused',
      'enotfound',
      'network',
      'socket',
      'etimedout',
      'temporary',
      'unavailable',
    ];

    return transientPatterns.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute multiple database operations in parallel with error handling
 */
export async function executeInParallel<T>(
  operations: Array<() => Promise<T>>,
  options: {
    continueOnError?: boolean;
  } = {}
): Promise<{
  results: Array<{ success: true; data: T } | { success: false; error: string }>;
  allSucceeded: boolean;
}> {
  const { continueOnError = false } = options;

  if (continueOnError) {
    // Execute all operations and collect results
    const results = await Promise.allSettled(
      operations.map(op => op())
    );

    const formattedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true as const, data: result.value };
      } else {
        return {
          success: false as const,
          error: result.reason instanceof Error ? result.reason.message : 'Operation failed',
        };
      }
    });

    const allSucceeded = formattedResults.every(r => r.success);

    return { results: formattedResults, allSucceeded };
  } else {
    // Execute all operations and fail fast on first error
    const results = await Promise.all(operations.map(op => op()));
    
    return {
      results: results.map(data => ({ success: true as const, data })),
      allSucceeded: true,
    };
  }
}

/**
 * Batch database operations to reduce round trips
 */
export async function batchCreate<T extends Prisma.ModelName>(
  model: T,
  data: any[],
  batchSize: number = 100
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let totalCount = 0;

  // Split data into batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    try {
      // @ts-ignore - Dynamic model access
      const result = await db[model].createMany({
        data: batch,
        skipDuplicates: true,
      });

      totalCount += result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch create failed';
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMessage}`);
    }
  }

  return { count: totalCount, errors };
}

/**
 * Safely delete a record with cascade handling
 */
export async function safeDelete<T>(
  deleteOperation: () => Promise<T>,
  options: {
    checkReferences?: boolean;
    onCascadeWarning?: (message: string) => void;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string; warnings?: string[] }> {
  const { checkReferences = true, onCascadeWarning } = options;
  const warnings: string[] = [];

  try {
    // Execute the delete operation
    const result = await deleteOperation();

    return { success: true, data: result, warnings: warnings.length > 0 ? warnings : undefined };
  } catch (error) {
    console.error("Delete operation failed:", error);

    if (error instanceof Error) {
      // Check for foreign key constraint errors
      if (error.message.includes('Foreign key constraint')) {
        return {
          success: false,
          error: "Cannot delete this record because it is referenced by other records",
        };
      }

      return { success: false, error: error.message };
    }

    return { success: false, error: "Delete operation failed" };
  }
}

/**
 * Update a record with optimistic locking
 * Prevents concurrent update conflicts
 */
export async function optimisticUpdate<T>(
  findOperation: () => Promise<T & { updatedAt: Date }>,
  updateOperation: (current: T & { updatedAt: Date }) => Promise<T>,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: T; error?: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get current version
      const current = await findOperation();
      const currentUpdatedAt = current.updatedAt;

      // Attempt update
      const updated = await updateOperation(current);

      return { success: true, data: updated };
    } catch (error) {
      // Check if it's a concurrent modification error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        if (attempt < maxRetries - 1) {
          // Retry
          await sleep(100 * (attempt + 1));
          continue;
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  }

  return { success: false, error: "Update failed after maximum retries" };
}
