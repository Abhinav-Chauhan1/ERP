import { Metadata } from "next";
import { AuthAnalyticsDashboard } from "@/components/super-admin/analytics/auth-analytics-dashboard";

export const metadata: Metadata = {
  title: "Authentication Analytics | Super Admin",
  description: "Monitor authentication patterns, security events, and user activity across all schools",
};

/**
 * Authentication Analytics Page
 * 
 * Provides comprehensive authentication analytics for super admins including:
 * - Authentication success/failure rates
 * - User activity patterns
 * - Security events and alerts
 * - Login trends and insights
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */
export default function AuthenticationAnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <AuthAnalyticsDashboard />
    </div>
  );
}