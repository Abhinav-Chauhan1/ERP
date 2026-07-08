import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Joins first/last name parts, skipping any that are null/undefined/empty —
// avoids literal "null" showing up when lastName (or firstName) isn't set.
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

const CLASS_NAME_RANK: Record<string, number> = {
  "pre-nursery": -4,
  playgroup: -4,
  nursery: -3,
  lkg: -2,
  "lower kg": -2,
  "kg 1": -2,
  ukg: -1,
  "upper kg": -1,
  "kg 2": -1,
};

// Extracts a sortable numeric rank from a class name like "Class 10", "Grade 3",
// "Nursery", "LKG", "UKG" — returns null for anything unrecognized so callers
// can fall back to alphabetical order.
export function classNameRank(name: string): number | null {
  const normalized = name.trim().toLowerCase();
  if (normalized in CLASS_NAME_RANK) return CLASS_NAME_RANK[normalized];

  const match = normalized.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return null;
}

// Natural sort comparator for class names — e.g. "Class 2" before "Class 10",
// with pre-primary grades (Nursery/LKG/UKG) ordered before "Class 1". A plain
// string orderBy("name") sorts lexicographically, putting "Class 10"-"Class 19"
// and "Class 2" right after "Class 1". Falls back to locale-aware alphabetical
// order for anything that doesn't match a recognized pattern.
export function compareClassNames(a: string, b: string): number {
  const rankA = classNameRank(a);
  const rankB = classNameRank(b);

  if (rankA !== null && rankB !== null) return rankA - rankB;
  if (rankA !== null) return -1;
  if (rankB !== null) return 1;

  return a.localeCompare(b, undefined, { numeric: true });
}

// Sorts an array of objects with a `name` field using compareClassNames —
// convenience wrapper for the common "sort classes fetched from the DB" case.
export function sortByClassName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareClassNames(a.name, b.name));
}

// Applies compareClassNames within each contiguous run of a shared key,
// preserving the outer group order (e.g. classes already ordered by academic
// year from the DB) while fixing the lexicographic name order inside each group.
export function sortByClassNameWithinGroups<T extends { name: string }>(
  items: T[],
  groupKeyFn: (item: T) => string
): T[] {
  const result: T[] = [];
  let groupStart = 0;
  for (let i = 1; i <= items.length; i++) {
    if (i === items.length || groupKeyFn(items[i]) !== groupKeyFn(items[groupStart])) {
      result.push(...sortByClassName(items.slice(groupStart, i)));
      groupStart = i;
    }
  }
  return result;
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function dateIsInFuture(date: Date): boolean {
  return isValidDate(date) && date > new Date();
}

export function dateIsInPast(date: Date): boolean {
  return isValidDate(date) && date < new Date();
}

export function dateIsBefore(date: Date, beforeDate: Date): boolean {
  return isValidDate(date) && isValidDate(beforeDate) && date < beforeDate;
}

export function dateIsAfter(date: Date, afterDate: Date): boolean {
  return isValidDate(date) && isValidDate(afterDate) && date > afterDate;
}

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
