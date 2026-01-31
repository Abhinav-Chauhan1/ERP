import { NextRequest, NextResponse } from 'next/server';
import { getDashboardAnalytics } from '@/lib/actions/analytics-actions';
import { getBillingDashboardData } from '@/lib/actions/billing-actions';

/**
 * Performance Test API Endpoint
 * Tests the optimized dashboard queries and reports performance metrics
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const queryMetrics: Array<{
    operation: string;
    duration: number;
    success: boolean;
    error?: string;
  }> = [];

  try {
    // Test Dashboard Analytics
    console.log('🧪 Testing dashboard analytics performance...');
    const dashboardStart = Date.now();
    
    try {
      const dashboardResult = await getDashboardAnalytics('30d');
      const dashboardDuration = Date.now() - dashboardStart;
      
      queryMetrics.push({
        operation: 'getDashboardAnalytics',
        duration: dashboardDuration,
        success: dashboardResult.success,
        error: dashboardResult.success ? undefined : dashboardResult.error
      });
      
      console.log(`✅ Dashboard analytics completed in ${dashboardDuration}ms`);
    } catch (error) {
      const dashboardDuration = Date.now() - dashboardStart;
      queryMetrics.push({
        operation: 'getDashboardAnalytics',
        duration: dashboardDuration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ Dashboard analytics failed in ${dashboardDuration}ms:`, error);
    }

    // Test Billing Analytics
    console.log('🧪 Testing billing analytics performance...');
    const billingStart = Date.now();
    
    try {
      const billingResult = await getBillingDashboardData('30d');
      const billingDuration = Date.now() - billingStart;
      
      queryMetrics.push({
        operation: 'getBillingDashboardData',
        duration: billingDuration,
        success: billingResult.success,
        error: billingResult.success ? undefined : billingResult.error
      });
      
      console.log(`✅ Billing analytics completed in ${billingDuration}ms`);
    } catch (error) {
      const billingDuration = Date.now() - billingStart;
      queryMetrics.push({
        operation: 'getBillingDashboardData',
        duration: billingDuration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ Billing analytics failed in ${billingDuration}ms:`, error);
    }

    const totalDuration = Date.now() - startTime;

    // Generate performance report
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      operations: queryMetrics,
      summary: {
        totalOperations: queryMetrics.length,
        successfulOperations: queryMetrics.filter(m => m.success).length,
        failedOperations: queryMetrics.filter(m => !m.success).length,
        averageDuration: queryMetrics.length > 0 
          ? Math.round(queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length)
          : 0,
        slowestOperation: queryMetrics.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest, 
          { operation: 'none', duration: 0, success: true }
        ),
        fastestOperation: queryMetrics.reduce((fastest, current) => 
          current.duration < fastest.duration ? current : fastest,
          { operation: 'none', duration: Infinity, success: true }
        )
      },
      performance: {
        status: queryMetrics.every(m => m.success && m.duration < 2000) ? 'EXCELLENT' :
                queryMetrics.every(m => m.success && m.duration < 5000) ? 'GOOD' :
                queryMetrics.some(m => m.success) ? 'NEEDS_IMPROVEMENT' : 'POOR',
        recommendations: generateRecommendations(queryMetrics)
      }
    };

    console.log('📊 PERFORMANCE TEST RESULTS:');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Successful Operations: ${report.summary.successfulOperations}/${report.summary.totalOperations}`);
    console.log(`Average Duration: ${report.summary.averageDuration}ms`);
    console.log(`Performance Status: ${report.performance.status}`);

    return NextResponse.json(report);

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    
    return NextResponse.json({
      error: 'Performance test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateRecommendations(metrics: Array<{operation: string, duration: number, success: boolean, error?: string}>): string[] {
  const recommendations: string[] = [];
  
  const failedOps = metrics.filter(m => !m.success);
  if (failedOps.length > 0) {
    recommendations.push(`Fix ${failedOps.length} failed operations: ${failedOps.map(op => op.operation).join(', ')}`);
  }
  
  const slowOps = metrics.filter(m => m.success && m.duration > 2000);
  if (slowOps.length > 0) {
    recommendations.push(`Optimize ${slowOps.length} slow operations (>2s): ${slowOps.map(op => `${op.operation} (${op.duration}ms)`).join(', ')}`);
  }
  
  const avgDuration = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length 
    : 0;
    
  if (avgDuration > 1000) {
    recommendations.push('Consider adding database indexes or query optimization');
  }
  
  if (avgDuration > 500) {
    recommendations.push('Consider implementing caching for frequently accessed data');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance is excellent! No optimizations needed.');
  }
  
  return recommendations;
}