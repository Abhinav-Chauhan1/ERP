/**
 * Billing-related TypeScript interfaces and types
 */

export interface SubscriptionFilters {
  schoolId?: string;
  status?: string;
  planId?: string;
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentFilters {
  subscriptionId?: string;
  status?: string;
  paymentMethod?: string;
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSubscriptionData {
  schoolId: string;
  planId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionData {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export interface RefundData {
  amount: number;
  reason: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionResponse {
  id: string;
  schoolId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  school: {
    id: string;
    name: string;
    schoolCode: string;
  };
}

export interface PaymentResponse {
  id: string;
  subscriptionId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    id: string;
    school: {
      id: string;
      name: string;
      schoolCode: string;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    page: number;
    totalPages: number;
  };
}

export interface BillingMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  revenueGrowthRate: number;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  reason: string;
  processedAt: Date;
  metadata?: Record<string, any>;
}