"use client";

import { useListNavigation } from "./keyboard-shortcuts-provider";
import { cn } from "@/lib/utils";

interface NavigableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  onSelect: (item: T, index: number) => void;
  className?: string;
  itemClassName?: string;
}

/**
 * Navigable List Component
 * Requirements: 28.3
 * 
 * A list component that supports arrow key navigation
 * Use this component for any list that should support keyboard navigation
 * 
 * Example usage:
 * ```tsx
 * <NavigableList
 *   items={students}
 *   renderItem={(student, index, isSelected) => (
 *     <div className={isSelected ? 'bg-accent' : ''}>
 *       {student.name}
 *     </div>
 *   )}
 *   onSelect={(student) => router.push(`/students/${student.id}`)}
 * />
 * ```
 */
export function NavigableList<T>({
  items,
  renderItem,
  onSelect,
  className,
  itemClassName,
}: NavigableListProps<T>) {
  const { selectedIndex, containerRef } = useListNavigation<HTMLDivElement>({
    itemCount: items.length,
    onSelect: (index) => onSelect(items[index], index),
  });

  return (
    <div
      ref={containerRef}
      className={cn("focus:outline-none", className)}
      tabIndex={0}
      role="listbox"
      aria-label="Navigable list"
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "cursor-pointer transition-colors",
            selectedIndex === index && "bg-accent",
            itemClassName
          )}
          role="option"
          aria-selected={selectedIndex === index}
          onClick={() => onSelect(item, index)}
        >
          {renderItem(item, index, selectedIndex === index)}
        </div>
      ))}
    </div>
  );
}
