/**
 * Utility functions for complex assessment rules
 */

export type AssessmentRuleType = "BEST_OF" | "AVERAGE" | "WEIGHTED_AVERAGE" | "SUM";

export interface AssessmentRule {
    ruleType: AssessmentRuleType;
    count?: number | null; // For BEST_OF
    weight: number; // For WEIGHTED_AVERAGE (0-1.0)
}

/**
 * Aggregates marks from a set of exams based on a rule
 */
export function aggregateMarksByRule(
    marks: Array<{ obtained: number; total: number }>,
    rule: AssessmentRule
): { obtained: number; total: number } {
    if (marks.length === 0) return { obtained: 0, total: 0 };

    // Calculate percentages for each exam to compare them fairly if total marks vary
    const marksWithPercentage = marks.map(m => ({
        ...m,
        percentage: m.total > 0 ? (m.obtained / m.total) * 100 : 0
    }));

    switch (rule.ruleType) {
        case "BEST_OF": {
            const count = rule.count || 1;
            // Sort by percentage descending
            const sorted = [...marksWithPercentage].sort((a, b) => b.percentage - a.percentage);
            // Take the top N
            const topN = sorted.slice(0, count);

            const sumObtained = topN.reduce((sum, m) => sum + m.obtained, 0);
            const sumTotal = topN.reduce((sum, m) => sum + m.total, 0);

            return { obtained: sumObtained, total: sumTotal };
        }

        case "AVERAGE": {
            const sumObtained = marks.reduce((sum, m) => sum + m.obtained, 0);
            const sumTotal = marks.reduce((sum, m) => sum + m.total, 0);

            // We return the average marks normalized to the average total marks
            const avgPercentage = (sumObtained / sumTotal) * 100;
            const avgTotal = sumTotal / marks.length;

            return {
                obtained: (avgPercentage * avgTotal) / 100,
                total: avgTotal
            };
        }

        case "WEIGHTED_AVERAGE": {
            // Weight scales this rule's contribution proportionally, e.g. weight=0.4 means
            // this rule contributes 40% of the possible marks. Both obtained AND total must
            // be scaled so the percentage (obtained/total) stays the same but the absolute
            // contribution to the overall total is reduced correctly.
            const sumObtained = marks.reduce((sum, m) => sum + m.obtained, 0);
            const sumTotal = marks.reduce((sum, m) => sum + m.total, 0);

            return {
                obtained: sumObtained * rule.weight,
                total: sumTotal * rule.weight,
            };
        }

        case "SUM":
        default: {
            const sumObtained = marks.reduce((sum, m) => sum + m.obtained, 0);
            const sumTotal = marks.reduce((sum, m) => sum + m.total, 0);
            return { obtained: sumObtained, total: sumTotal };
        }
    }
}
