"use client";

/**
 * Hook for Optimistic Reordering
 * Provides optimistic UI updates for drag-and-drop reordering
 * Requirements: Task 16 - Optimistic UI updates for reordering
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface ReorderItem {
  id: string;
  order: number;
  [key: string]: any;
}

interface UseOptimisticReorderOptions<T extends ReorderItem> {
  items: T[];
  onReorder: (items: T[]) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOptimisticReorder<T extends ReorderItem>({
  items: initialItems,
  onReorder,
  onSuccess,
  onError,
}: UseOptimisticReorderOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isReordering, setIsReordering] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const previousItemsRef = useRef<T[]>(initialItems);

  // Update items when initialItems change (e.g., after successful save)
  useEffect(() => {
    if (!isReordering && !hasChanges) {
      setItems(initialItems);
      previousItemsRef.current = initialItems;
    }
  }, [initialItems, isReordering, hasChanges]);

  // Optimistically move an item
  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      // Update order values
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1,
      }));

      return reorderedItems as T[];
    });
    setHasChanges(true);
  }, []);

  // Save the reordered items
  const saveOrder = useCallback(async () => {
    if (!hasChanges) return;

    setIsReordering(true);
    try {
      const result = await onReorder(items);

      if (result.success) {
        // Update the reference to the new order
        previousItemsRef.current = items;
        setHasChanges(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Revert to previous order on error
        setItems(previousItemsRef.current);
        setHasChanges(false);
        if (onError) {
          onError(result.error || "Failed to save order");
        }
      }
    } catch (error) {
      // Revert to previous order on error
      setItems(previousItemsRef.current);
      setHasChanges(false);
      if (onError) {
        onError(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    } finally {
      setIsReordering(false);
    }
  }, [items, hasChanges, onReorder, onSuccess, onError]);

  // Cancel changes and revert to original order
  const cancelChanges = useCallback(() => {
    setItems(previousItemsRef.current);
    setHasChanges(false);
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setItems(initialItems);
    previousItemsRef.current = initialItems;
    setHasChanges(false);
    setIsReordering(false);
  }, [initialItems]);

  return {
    items,
    moveItem,
    saveOrder,
    cancelChanges,
    reset,
    isReordering,
    hasChanges,
  };
}

/**
 * Hook for optimistic updates with rollback
 * Generic hook for any optimistic update operation
 */
interface UseOptimisticUpdateOptions<T> {
  initialData: T;
  onUpdate: (data: T) => Promise<{ success: boolean; error?: string; data?: T }>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useOptimisticUpdate<T>({
  initialData,
  onUpdate,
  onSuccess,
  onError,
}: UseOptimisticUpdateOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousDataRef = useRef<T>(initialData);

  // Update data when initialData changes
  useEffect(() => {
    if (!isUpdating) {
      setData(initialData);
      previousDataRef.current = initialData;
    }
  }, [initialData, isUpdating]);

  // Optimistically update data
  const updateData = useCallback(
    async (newData: T) => {
      // Store previous data for rollback
      previousDataRef.current = data;

      // Optimistically update
      setData(newData);
      setIsUpdating(true);

      try {
        const result = await onUpdate(newData);

        if (result.success) {
          // Update with server response if available
          if (result.data) {
            setData(result.data);
            previousDataRef.current = result.data;
          } else {
            previousDataRef.current = newData;
          }

          if (onSuccess) {
            onSuccess(result.data || newData);
          }
        } else {
          // Rollback on error
          setData(previousDataRef.current);
          if (onError) {
            onError(result.error || "Update failed");
          }
        }
      } catch (error) {
        // Rollback on error
        setData(previousDataRef.current);
        if (onError) {
          onError(error instanceof Error ? error.message : "An unexpected error occurred");
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [data, onUpdate, onSuccess, onError]
  );

  // Rollback to previous data
  const rollback = useCallback(() => {
    setData(previousDataRef.current);
  }, []);

  return {
    data,
    updateData,
    rollback,
    isUpdating,
  };
}
