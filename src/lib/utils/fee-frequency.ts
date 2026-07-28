import { FeeFrequency } from "@prisma/client";

/**
 * Number of billing occurrences per academic year for a fee type's frequency,
 * used to expand a per-occurrence amount (e.g. Monthly tuition) into its annual total.
 *
 * Client-safe: no server-only imports, so this can be shared between client
 * components and server-side services without pulling in Prisma/db.
 */
export function getFeeFrequencyMultiplier(frequency: FeeFrequency | string): number {
  switch (frequency) {
    case "MONTHLY":
      return 12;
    case "QUARTERLY":
      return 4;
    case "SEMI_ANNUAL":
      return 2;
    case "ANNUAL":
    case "ONE_TIME":
    default:
      return 1;
  }
}
