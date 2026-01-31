/**
 * Cached Auth Analytics Queries
 * Provides cached versions of auth analytics functions to prevent N+1 queries
 */

import { cachedQuery, CACHE_DURATION, CACHE_TAGS } from "./cache";
import { authAnalyticsService, AuthAnalyticsTimeRange, AuthAnalyticsFilters } from "@/lib/services/auth-analytics-service";

/**
 * Cached version of auth analytics dashboard
 * Cache for 5 minutes since analytics data changes frequently
 */
export const getCachedAuthAnalyticsDashboard = cachedQuery(
  async (timeRange: AuthAnalyticsTimeRange, filters: AuthAnalyticsFilters = {}) => {
    return await authAnalyticsService.getAuthAnalyticsDashboard(timeRange, filters);
  },
  {
    name: "auth-analytics-dashboard",
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.MEDIUM, // 5 minutes
  }
);

/**
 * Cached version of authentication metrics
 * Cache for 5 minutes since metrics change frequently
 */
export const getCachedAuthenticationMetrics = cachedQuery(
  async (timeRange: AuthAnalyticsTimeRange, filters: AuthAnalyticsFilters = {}) => {
    return await authAnalyticsService.getAuthenticationMetrics(timeRange, filters);
  },
  {
    name: "authentication-metrics",
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.MEDIUM, // 5 minutes
  }
);

/**
 * Cached version of user activity metrics
 * Cache for 5 minutes since activity data changes frequently
 */
export const getCachedUserActivityMetrics = cachedQuery(
  async (timeRange: AuthAnalyticsTimeRange, filters: AuthAnalyticsFilters = {}) => {
    return await authAnalyticsService.getUserActivityMetrics(timeRange, filters);
  },
  {
    name: "user-activity-metrics",
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.MEDIUM, // 5 minutes
  }
);

/**
 * Cached version of security metrics
 * Cache for 5 minutes since security data is important and changes frequently
 */
export const getCachedSecurityMetrics = cachedQuery(
  async (timeRange: AuthAnalyticsTimeRange, filters: AuthAnalyticsFilters = {}) => {
    return await authAnalyticsService.getSecurityMetrics(timeRange, filters);
  },
  {
    name: "security-metrics",
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.MEDIUM, // 5 minutes
  }
);