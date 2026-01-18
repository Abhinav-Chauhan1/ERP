"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string | ReactNode;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  mobileLabel?: string; // Optional custom label for mobile view
  mobilePriority?: "high" | "low"; // Priority for mobile display - high shows always, low is hidden
  mobileRender?: (item: T, index: number) => ReactNode; // Optional custom render for mobile
  isHeader?: boolean; // If true, renders as main card header on mobile
  isAction?: boolean; // If true, renders in action bar on mobile
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

  // Separate columns by mobile role
  const headerColumn = columns.find((col) => col.isHeader);
  const actionColumn = columns.find((col) => col.isAction);
  const highPriorityColumns = columns.filter(
    (col) => !col.isHeader && !col.isAction && col.mobilePriority !== "low"
  );
  const lowPriorityColumns = columns.filter(
    (col) => !col.isHeader && !col.isAction && col.mobilePriority === "low"
  );

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
              {data.map((item, index) => (
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
                      {column.render(item, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              "rounded-lg border bg-card overflow-hidden shadow-sm",
              onRowClick && "cursor-pointer active:bg-accent/50 transition-colors"
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* Card Header - Primary info (Name + Avatar typically) */}
            {headerColumn && (
              <div className="px-3 py-2.5 bg-accent/30 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {headerColumn.mobileRender
                      ? headerColumn.mobileRender(item, index)
                      : headerColumn.render(item, index)}
                  </div>
                </div>
              </div>
            )}

            {/* Card Body - High priority columns */}
            <div className="px-3 py-2 space-y-1.5">
              {highPriorityColumns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-muted-foreground font-medium shrink-0">
                    {column.mobileLabel || column.label}
                  </span>
                  <div className="text-right truncate">
                    {column.mobileRender
                      ? column.mobileRender(item, index)
                      : column.render(item, index)}
                  </div>
                </div>
              ))}

              {/* Low priority columns - shown smaller */}
              {lowPriorityColumns.length > 0 && (
                <div className="pt-1.5 mt-1.5 border-t border-dashed space-y-1">
                  {lowPriorityColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span className="font-medium shrink-0">
                        {column.mobileLabel || column.label}
                      </span>
                      <div className="text-right truncate">
                        {column.mobileRender
                          ? column.mobileRender(item, index)
                          : column.render(item, index)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card Footer - Actions */}
            {actionColumn && (
              <div className="px-3 py-2 bg-accent/20 border-t">
                <div className="flex justify-end gap-1">
                  {actionColumn.mobileRender
                    ? actionColumn.mobileRender(item, index)
                    : actionColumn.render(item, index)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
