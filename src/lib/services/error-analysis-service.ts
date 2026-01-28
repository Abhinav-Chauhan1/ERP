/**
 * Error Analysis Service
 * 
 * Provides intelligent error aggregation, pattern detection,
 * and automated error analysis for the monitoring system.
 * 
 * Requirements: 8.5
 */

import { db } from '@/lib/db';

export interface ErrorInsight {
  pattern: string;
  frequency: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  affectedSystems: string[];
}

export class ErrorAnalysisService {
  
  /**
   * Analyze error patterns and generate insights
   * Requirement: 8.5
   */
  async analyzeErrorPatterns(timeRange: { startDate: Date; endDate: Date }): Promise<ErrorInsight[]> {
    try {
      const errors = await db.communicationErrorLog.findMany({
        where: {
          createdAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate,
          },
        },
      });

      const insights: ErrorInsight[] = [];
      const patterns = this.groupErrorsByPattern(errors);

      for (const [pattern, errorList] of patterns.entries()) {
        const insight: ErrorInsight = {
          pattern,
          frequency: errorList.length,
          impact: this.calculateImpact(errorList),
          recommendation: this.generateRecommendation(pattern, errorList),
          affectedSystems: [...new Set(errorList.map(e => e.channel))],
        };
        insights.push(insight);
      }

      return insights.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      throw new Error(`Failed to analyze error patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupErrorsByPattern(errors: any[]): Map<string, any[]> {
    const patterns = new Map<string, any[]>();
    
    errors.forEach(error => {
      const pattern = this.normalizeErrorMessage(error.message || 'Unknown');
      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }
      patterns.get(pattern)!.push(error);
    });

    return patterns;
  }

  private normalizeErrorMessage(message: string): string {
    return message
      .replace(/\d+/g, 'N')
      .replace(/[a-f0-9-]{36}/gi, 'UUID')
      .toLowerCase()
      .trim();
  }

  private calculateImpact(errors: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalCount = errors.filter(e => e.severity === 'CRITICAL').length;
    const highCount = errors.filter(e => e.severity === 'HIGH').length;
    
    if (criticalCount > 0 || errors.length > 100) return 'CRITICAL';
    if (highCount > 0 || errors.length > 50) return 'HIGH';
    if (errors.length > 10) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendation(pattern: string, errors: any[]): string {
    if (pattern.includes('timeout')) {
      return 'Consider increasing timeout values or optimizing slow operations';
    }
    if (pattern.includes('rate limit')) {
      return 'Review and adjust rate limiting configuration';
    }
    if (pattern.includes('authentication')) {
      return 'Check authentication credentials and token expiration';
    }
    return 'Review error logs and implement appropriate error handling';
  }
}

export const errorAnalysisService = new ErrorAnalysisService();