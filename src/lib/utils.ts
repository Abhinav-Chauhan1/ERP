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
