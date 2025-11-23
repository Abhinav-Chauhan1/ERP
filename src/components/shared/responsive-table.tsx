"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Optional custom label for mobile view
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyState?: ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  onRowClick,
  className,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className="rounded-md border p-8">{emptyState}</div>;
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className={cn("hidden md:block rounded-md border", className)}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "py-3 px-4 text-left font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    "border-b hover:bg-accent/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("py-3 px-4 align-middle", column.className)}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              "rounded-lg border bg-card p-4 space-y-3 shadow-sm",
              onRowClick && "cursor-pointer active:bg-accent/50 transition-colors"
            )}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-start gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                  {column.mobileLabel || column.label}
                </span>
                <div className="text-sm text-right flex-1">
                  {column.render(item)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
