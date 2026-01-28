import Razorpay from 'razorpay';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface PaymentMethodData {
  schoolId: string;
  type: 'card' | 'netbanking' | 'wallet' | 'upi';
  details: {
    // For cards
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    holderName?: string;
    
    // For UPI
    vpa?: string;
    
    // For netbanking
    bankCode?: string;
    
    // For wallet
    walletProvider?: string;
  };
  isDefault?: boolean;
  metadata?: Record<string, string>;
}

export interface PaymentMethodInfo {
  id: string;
  schoolId: string;
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface PaymentMethodValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class PaymentMethodService {
  /**
   * Add a new payment method for a school
   */
  async addPaymentMethod(data: PaymentMethodData): Promise<PaymentMethodInfo> {
    try {
      // Validate payment method data
      const validation = await this.validatePaymentMethod(data);
      if (!validation.isValid) {
        throw new Error(`Invalid payment method: ${validation.errors.join(', ')}`);
      }

      // Get school information
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId }
      });

      if (!school) {
        throw new Error(`School not found: ${data.schoolId}`);
      }

      // Create or get Razorpay customer
      let razorpayCustomerId = school.razorpayCustomerId;
      
      if (!razorpayCustomerId) {
        const customer = await razorpay.customers.create({
          name: school.name,
          email: school.email || `${school.schoolCode}@school.com`,
          contact: school.phone || '',
          notes: {
            schoolId: data.schoolId,
            schoolCode: school.schoolCode
          }
        });
        
        razorpayCustomerId = customer.id;
        
        // Update school with Razorpay customer ID
        await prisma.school.update({
          where: { id: data.schoolId },
          data: { razorpayCustomerId }
        });
      }

      // For Razorpay, we store payment method details securely
      // In production, you would tokenize sensitive data
      const encryptedDetails = this.encryptPaymentDetails(data.details);

      // If this is set as default, unset other default methods
      if (data.isDefault) {
        await prisma.paymentMethodRecord.updateMany({
          where: { 
            schoolId: data.schoolId,
            isDefault: true 
          },
          data: { isDefault: false }
        });
      }

      // Create payment method record
      const paymentMethod = await prisma.paymentMethodRecord.create({
        data: {
          schoolId: data.schoolId,
          razorpayCustomerId,
          type: data.type,
          encryptedDetails,
          last4: this.extractLast4(data.details),
          brand: this.extractBrand(data.details),
          expiryMonth: data.details.expiryMonth,
          expiryYear: data.details.expiryYear,
          holderName: data.details.holderName,
          isDefault: data.isDefault || false,
          isActive: true,
          metadata: data.metadata || {},
        }
      });

      return this.formatPaymentMethod(paymentMethod);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing payment method
   */
  async updatePaymentMethod(paymentMethodId: string, updates: Partial<PaymentMethodData>): Promise<PaymentMethodInfo> {
    try {
      const existingMethod = await prisma.paymentMethodRecord.findUnique({
        where: { id: paymentMethodId }
      });

      if (!existingMethod) {
        throw new Error(`Payment method not found: ${paymentMethodId}`);
      }

      const updateData: any = {};

      // Handle setting as default
      if (updates.isDefault) {
        await prisma.paymentMethodRecord.updateMany({
          where: { 
            schoolId: existingMethod.schoolId,
            isDefault: true,
            id: { not: paymentMethodId }
          },
          data: { isDefault: false }
        });
        updateData.isDefault = true;
      }

      // Handle metadata updates
      if (updates.metadata) {
        updateData.metadata = {
          ...existingMethod.metadata as Record<string, any>,
          ...updates.metadata
        };
      }

      // Handle payment details updates (for non-sensitive fields only)
      if (updates.details) {
        if (updates.details.holderName) {
          updateData.holderName = updates.details.holderName;
        }
      }

      const updatedMethod = await prisma.paymentMethodRecord.update({
        where: { id: paymentMethodId },
        data: updateData
      });

      return this.formatPaymentMethod(updatedMethod);
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw new Error(`Failed to update payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const paymentMethod = await prisma.paymentMethodRecord.findUnique({
        where: { id: paymentMethodId }
      });

      if (!paymentMethod) {
        throw new Error(`Payment method not found: ${paymentMethodId}`);
      }

      // Check if this payment method is being used in active subscriptions
      const activeSubscriptions = await prisma.enhancedSubscription.count({
        where: {
          schoolId: paymentMethod.schoolId,
          status: 'ACTIVE'
        }
      });

      if (activeSubscriptions > 0 && paymentMethod.isDefault) {
        throw new Error('Cannot remove default payment method while active subscriptions exist');
      }

      // Soft delete the payment method
      await prisma.paymentMethodRecord.update({
        where: { id: paymentMethodId },
        data: { 
          isActive: false,
          isDefault: false
        }
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error(`Failed to remove payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all payment methods for a school
   */
  async getPaymentMethods(schoolId: string): Promise<PaymentMethodInfo[]> {
    try {
      const paymentMethods = await prisma.paymentMethodRecord.findMany({
        where: { 
          schoolId,
          isActive: true
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return paymentMethods.map(method => this.formatPaymentMethod(method));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error(`Failed to get payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default payment method for a school
   */
  async getDefaultPaymentMethod(schoolId: string): Promise<PaymentMethodInfo | null> {
    try {
      const paymentMethod = await prisma.paymentMethodRecord.findFirst({
        where: { 
          schoolId,
          isDefault: true,
          isActive: true
        }
      });

      return paymentMethod ? this.formatPaymentMethod(paymentMethod) : null;
    } catch (error) {
      console.error('Error getting default payment method:', error);
      throw new Error(`Failed to get default payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate payment method data
   */
  async validatePaymentMethod(data: PaymentMethodData): Promise<PaymentMethodValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId }
    });

    if (!school) {
      errors.push('School not found');
    }

    // Validate based on payment method type
    switch (data.type) {
      case 'card':
        if (!data.details.cardNumber) {
          errors.push('Card number is required');
        } else if (!this.isValidCardNumber(data.details.cardNumber)) {
          errors.push('Invalid card number');
        }

        if (!data.details.expiryMonth || !data.details.expiryYear) {
          errors.push('Expiry date is required');
        } else if (!this.isValidExpiryDate(data.details.expiryMonth, data.details.expiryYear)) {
          errors.push('Invalid or expired card');
        }

        if (!data.details.cvv) {
          errors.push('CVV is required');
        } else if (!this.isValidCVV(data.details.cvv)) {
          errors.push('Invalid CVV');
        }

        if (!data.details.holderName) {
          errors.push('Card holder name is required');
        }
        break;

      case 'upi':
        if (!data.details.vpa) {
          errors.push('UPI VPA is required');
        } else if (!this.isValidUPI(data.details.vpa)) {
          errors.push('Invalid UPI VPA format');
        }
        break;

      case 'netbanking':
        if (!data.details.bankCode) {
          errors.push('Bank code is required');
        }
        break;

      case 'wallet':
        if (!data.details.walletProvider) {
          errors.push('Wallet provider is required');
        }
        break;

      default:
        errors.push('Invalid payment method type');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Process a refund using a specific payment method
   */
  async processRefund(paymentMethodId: string, amount: number, reason?: string): Promise<any> {
    try {
      const paymentMethod = await prisma.paymentMethodRecord.findUnique({
        where: { id: paymentMethodId }
      });

      if (!paymentMethod) {
        throw new Error(`Payment method not found: ${paymentMethodId}`);
      }

      // Find the most recent successful payment for this payment method
      const recentPayment = await prisma.payment.findFirst({
        where: {
          subscription: {
            schoolId: paymentMethod.schoolId
          },
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!recentPayment || !recentPayment.razorpayPaymentId) {
        throw new Error('No eligible payment found for refund');
      }

      // Process refund through Razorpay
      const refund = await razorpay.payments.refund(recentPayment.razorpayPaymentId, {
        amount: amount,
        notes: {
          reason: reason || 'Refund requested',
          paymentMethodId: paymentMethodId
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: recentPayment.id },
        data: {
          status: amount < recentPayment.amount ? 'PARTIAL' : 'REFUNDED'
        }
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: reason
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private encryptPaymentDetails(details: any): string {
    // In production, use proper encryption
    // This is a simplified example
    const key = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production';
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(JSON.stringify(details), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptPaymentDetails(encryptedDetails: string): any {
    // In production, use proper decryption
    const key = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedDetails, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  private extractLast4(details: any): string | undefined {
    if (details.cardNumber) {
      return details.cardNumber.slice(-4);
    }
    if (details.vpa) {
      return details.vpa.slice(-4);
    }
    return undefined;
  }

  private extractBrand(details: any): string | undefined {
    if (details.cardNumber) {
      const cardNumber = details.cardNumber.replace(/\s/g, '');
      if (cardNumber.startsWith('4')) return 'Visa';
      if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) return 'Mastercard';
      if (cardNumber.startsWith('3')) return 'American Express';
      if (cardNumber.startsWith('6')) return 'Discover';
    }
    if (details.walletProvider) {
      return details.walletProvider;
    }
    if (details.bankCode) {
      return 'NetBanking';
    }
    if (details.vpa) {
      return 'UPI';
    }
    return undefined;
  }

  private isValidCardNumber(cardNumber: string): boolean {
    // Luhn algorithm for card validation
    const num = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(num)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private isValidExpiryDate(month: string, year: string): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  }

  private isValidCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  private isValidUPI(vpa: string): boolean {
    // Basic UPI VPA validation
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(vpa);
  }

  private formatPaymentMethod(method: any): PaymentMethodInfo {
    return {
      id: method.id,
      schoolId: method.schoolId,
      type: method.type,
      last4: method.last4,
      brand: method.brand,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      holderName: method.holderName,
      isDefault: method.isDefault,
      isActive: method.isActive,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
      metadata: method.metadata
    };
  }
}

export const paymentMethodService = new PaymentMethodService();