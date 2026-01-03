/**
 * Cost Calculation Service
 * 
 * This service handles cost calculation for messages sent through different
 * communication channels (SMS via MSG91, WhatsApp, Email). It provides
 * pricing configuration and cost estimation for analytics and tracking.
 * 
 * Requirement: 15.3
 */

import { CommunicationChannel } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Pricing configuration for a communication channel
 */
export interface ChannelPricing {
  channel: CommunicationChannel;
  costPerMessage: number; // Cost in INR
  currency: string;
  description?: string;
}

/**
 * Message cost calculation parameters
 */
export interface CalculateCostParams {
  channel: CommunicationChannel;
  messageLength?: number; // For SMS, affects cost if multi-part
  mediaType?: 'image' | 'document' | 'video' | 'audio'; // For WhatsApp media
  isInternational?: boolean; // For international messages
  recipientCount?: number; // For bulk messages
}

/**
 * Cost calculation result
 */
export interface CostCalculationResult {
  channel: CommunicationChannel;
  costPerMessage: number;
  totalCost: number;
  currency: string;
  breakdown?: {
    baseCost: number;
    additionalCharges?: number;
    recipientCount?: number;
  };
}

// ============================================================================
// Pricing Configuration
// ============================================================================

/**
 * Default pricing configuration for communication channels
 * 
 * These are approximate costs based on typical Indian market rates.
 * Update these values based on your actual provider pricing.
 * 
 * MSG91 SMS Pricing (India):
 * - Transactional SMS: ₹0.20 - ₹0.25 per SMS
 * - Promotional SMS: ₹0.15 - ₹0.20 per SMS
 * 
 * WhatsApp Business API Pricing (India):
 * - Marketing conversations: ₹0.40 - ₹0.50 per conversation
 * - Utility conversations: ₹0.25 - ₹0.35 per conversation
 * - Service conversations: Free (user-initiated, 24hr window)
 * 
 * Email: Typically free or very low cost (₹0.01 - ₹0.05)
 */
const DEFAULT_PRICING: Record<CommunicationChannel, ChannelPricing> = {
  [CommunicationChannel.SMS]: {
    channel: CommunicationChannel.SMS,
    costPerMessage: 0.22, // ₹0.22 per SMS (MSG91 transactional)
    currency: 'INR',
    description: 'MSG91 Transactional SMS'
  },
  [CommunicationChannel.WHATSAPP]: {
    channel: CommunicationChannel.WHATSAPP,
    costPerMessage: 0.35, // ₹0.35 per message (utility conversation)
    currency: 'INR',
    description: 'WhatsApp Business API - Utility Conversation'
  },
  [CommunicationChannel.EMAIL]: {
    channel: CommunicationChannel.EMAIL,
    costPerMessage: 0.02, // ₹0.02 per email
    currency: 'INR',
    description: 'Email via SMTP'
  },
  [CommunicationChannel.IN_APP]: {
    channel: CommunicationChannel.IN_APP,
    costPerMessage: 0.0, // Free
    currency: 'INR',
    description: 'In-App Notification (Free)'
  }
};

/**
 * International SMS pricing multiplier
 */
const INTERNATIONAL_SMS_MULTIPLIER = 3.0; // 3x cost for international SMS

/**
 * WhatsApp media message additional cost
 */
const WHATSAPP_MEDIA_ADDITIONAL_COST = 0.05; // ₹0.05 extra for media messages

/**
 * SMS length thresholds (characters)
 * Standard SMS: 160 characters
 * Unicode SMS: 70 characters
 */
const SMS_STANDARD_LENGTH = 160;
const SMS_UNICODE_LENGTH = 70;

// ============================================================================
// Pricing Configuration Management
// ============================================================================

/**
 * Custom pricing configuration (can be overridden via environment variables)
 */
let customPricing: Partial<Record<CommunicationChannel, ChannelPricing>> = {};

/**
 * Load pricing configuration from environment variables
 * 
 * Environment variables:
 * - PRICING_SMS_COST: Cost per SMS in INR
 * - PRICING_WHATSAPP_COST: Cost per WhatsApp message in INR
 * - PRICING_EMAIL_COST: Cost per email in INR
 */
export function loadPricingFromEnvironment(): void {
  try {
    if (process.env.PRICING_SMS_COST) {
      const cost = parseFloat(process.env.PRICING_SMS_COST);
      if (!isNaN(cost) && cost >= 0) {
        customPricing[CommunicationChannel.SMS] = {
          ...DEFAULT_PRICING[CommunicationChannel.SMS],
          costPerMessage: cost
        };
      }
    }

    if (process.env.PRICING_WHATSAPP_COST) {
      const cost = parseFloat(process.env.PRICING_WHATSAPP_COST);
      if (!isNaN(cost) && cost >= 0) {
        customPricing[CommunicationChannel.WHATSAPP] = {
          ...DEFAULT_PRICING[CommunicationChannel.WHATSAPP],
          costPerMessage: cost
        };
      }
    }

    if (process.env.PRICING_EMAIL_COST) {
      const cost = parseFloat(process.env.PRICING_EMAIL_COST);
      if (!isNaN(cost) && cost >= 0) {
        customPricing[CommunicationChannel.EMAIL] = {
          ...DEFAULT_PRICING[CommunicationChannel.EMAIL],
          costPerMessage: cost
        };
      }
    }
  } catch (error) {
    console.error('Error loading pricing from environment:', error);
  }
}

/**
 * Set custom pricing for a channel
 * 
 * @param channel - Communication channel
 * @param pricing - Pricing configuration
 */
export function setChannelPricing(
  channel: CommunicationChannel,
  pricing: ChannelPricing
): void {
  customPricing[channel] = pricing;
}

/**
 * Get pricing for a channel
 * 
 * @param channel - Communication channel
 * @returns Channel pricing configuration
 */
export function getChannelPricing(
  channel: CommunicationChannel
): ChannelPricing {
  return customPricing[channel] || DEFAULT_PRICING[channel];
}

/**
 * Get all channel pricing
 * 
 * @returns All channel pricing configurations
 */
export function getAllChannelPricing(): ChannelPricing[] {
  return Object.values(CommunicationChannel).map(channel => 
    getChannelPricing(channel)
  );
}

// ============================================================================
// Cost Calculation Functions
// ============================================================================

/**
 * Calculate message cost
 * Requirement: 15.3
 * 
 * Calculates the estimated cost of sending a message through a specific
 * communication channel. Takes into account message length (for SMS),
 * media type (for WhatsApp), and international delivery.
 * 
 * @param params - Cost calculation parameters
 * @returns Cost calculation result
 */
export function calculateMessageCost(
  params: CalculateCostParams
): CostCalculationResult {
  const {
    channel,
    messageLength = 0,
    mediaType,
    isInternational = false,
    recipientCount = 1
  } = params;

  // Get base pricing for the channel
  const pricing = getChannelPricing(channel);
  let costPerMessage = pricing.costPerMessage;
  let additionalCharges = 0;

  // Calculate cost based on channel-specific rules
  switch (channel) {
    case CommunicationChannel.SMS:
      costPerMessage = calculateSMSCost(messageLength, isInternational);
      break;

    case CommunicationChannel.WHATSAPP:
      if (mediaType) {
        additionalCharges = WHATSAPP_MEDIA_ADDITIONAL_COST;
        costPerMessage += additionalCharges;
      }
      break;

    case CommunicationChannel.EMAIL:
    case CommunicationChannel.IN_APP:
      // No additional calculations needed
      break;
  }

  // Calculate total cost for all recipients
  const totalCost = costPerMessage * recipientCount;

  return {
    channel,
    costPerMessage,
    totalCost,
    currency: pricing.currency,
    breakdown: {
      baseCost: pricing.costPerMessage,
      additionalCharges: additionalCharges > 0 ? additionalCharges : undefined,
      recipientCount: recipientCount > 1 ? recipientCount : undefined
    }
  };
}

/**
 * Calculate SMS cost based on message length and destination
 * 
 * SMS messages are charged per segment:
 * - Standard SMS: 160 characters per segment
 * - Unicode SMS: 70 characters per segment
 * - International SMS: 3x cost multiplier
 * 
 * @param messageLength - Length of the message in characters
 * @param isInternational - Whether the message is international
 * @returns Cost per SMS
 */
function calculateSMSCost(
  messageLength: number,
  isInternational: boolean
): number {
  const basePricing = getChannelPricing(CommunicationChannel.SMS);
  let costPerMessage = basePricing.costPerMessage;

  // Determine if message is Unicode (contains non-ASCII characters)
  // For simplicity, we'll use standard length threshold
  const lengthThreshold = SMS_STANDARD_LENGTH;

  // Calculate number of SMS segments
  let segments = 1;
  if (messageLength > lengthThreshold) {
    segments = Math.ceil(messageLength / lengthThreshold);
  }

  // Calculate cost
  costPerMessage = costPerMessage * segments;

  // Apply international multiplier if needed
  if (isInternational) {
    costPerMessage = costPerMessage * INTERNATIONAL_SMS_MULTIPLIER;
  }

  return costPerMessage;
}

/**
 * Calculate bulk message cost
 * 
 * @param channel - Communication channel
 * @param recipientCount - Number of recipients
 * @param messageLength - Length of message (for SMS)
 * @param mediaType - Media type (for WhatsApp)
 * @returns Total cost for bulk send
 */
export function calculateBulkMessageCost(
  channel: CommunicationChannel,
  recipientCount: number,
  messageLength?: number,
  mediaType?: 'image' | 'document' | 'video' | 'audio'
): CostCalculationResult {
  return calculateMessageCost({
    channel,
    messageLength,
    mediaType,
    recipientCount
  });
}

/**
 * Compare costs across channels
 * Requirement: 15.4
 * 
 * Compares the cost of sending a message through different channels.
 * Useful for cost optimization and analytics.
 * 
 * @param messageLength - Length of message (for SMS)
 * @param recipientCount - Number of recipients
 * @returns Cost comparison across all channels
 */
export function compareChannelCosts(
  messageLength: number = 160,
  recipientCount: number = 1
): CostCalculationResult[] {
  const channels = [
    CommunicationChannel.SMS,
    CommunicationChannel.WHATSAPP,
    CommunicationChannel.EMAIL,
    CommunicationChannel.IN_APP
  ];

  return channels.map(channel => 
    calculateMessageCost({
      channel,
      messageLength,
      recipientCount
    })
  );
}

/**
 * Get cheapest channel for a message
 * 
 * @param messageLength - Length of message
 * @param recipientCount - Number of recipients
 * @param excludeChannels - Channels to exclude from comparison
 * @returns Cheapest channel and its cost
 */
export function getCheapestChannel(
  messageLength: number = 160,
  recipientCount: number = 1,
  excludeChannels: CommunicationChannel[] = []
): CostCalculationResult {
  const costs = compareChannelCosts(messageLength, recipientCount)
    .filter(cost => !excludeChannels.includes(cost.channel));

  if (costs.length === 0) {
    throw new Error('No channels available for cost comparison');
  }

  return costs.reduce((cheapest, current) => 
    current.totalCost < cheapest.totalCost ? current : cheapest
  );
}

/**
 * Calculate cost savings
 * 
 * Calculates the cost savings when switching from one channel to another.
 * 
 * @param fromChannel - Original channel
 * @param toChannel - New channel
 * @param messageCount - Number of messages
 * @param messageLength - Length of message
 * @returns Cost savings amount and percentage
 */
export function calculateCostSavings(
  fromChannel: CommunicationChannel,
  toChannel: CommunicationChannel,
  messageCount: number,
  messageLength: number = 160
): {
  savings: number;
  savingsPercentage: number;
  fromCost: number;
  toCost: number;
  currency: string;
} {
  const fromCost = calculateMessageCost({
    channel: fromChannel,
    messageLength,
    recipientCount: messageCount
  });

  const toCost = calculateMessageCost({
    channel: toChannel,
    messageLength,
    recipientCount: messageCount
  });

  const savings = fromCost.totalCost - toCost.totalCost;
  const savingsPercentage = fromCost.totalCost > 0 
    ? (savings / fromCost.totalCost) * 100 
    : 0;

  return {
    savings,
    savingsPercentage,
    fromCost: fromCost.totalCost,
    toCost: toCost.totalCost,
    currency: fromCost.currency
  };
}

// ============================================================================
// Initialization
// ============================================================================

// Load pricing from environment on module load
loadPricingFromEnvironment();
