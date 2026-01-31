/**
 * Test script for communication configuration validation
 * 
 * This script tests the configuration validation utilities for MSG91 and WhatsApp.
 * Run with: tsx scripts/test-communication-config.ts
 */

import {
  validateMSG91Config,
  validateWhatsAppConfig,
  validateAllCommunicationConfigs,
  isMSG91Configured,
  isWhatsAppConfigured,
  logCommunicationConfigStatus,
  getMSG91Config,
  getWhatsAppConfig
} from '../src/lib/utils/communication-config';

console.log('=== Communication Configuration Test ===\n');

// Test 1: Check if services are enabled
console.log('1. Checking if services are enabled...');
console.log(`   USE_MSG91: ${process.env.USE_MSG91}`);
console.log(`   USE_WHATSAPP: ${process.env.USE_WHATSAPP}`);
console.log();

// Test 2: Validate MSG91 configuration
console.log('2. Validating MSG91 configuration...');
const msg91Validation = validateMSG91Config();
console.log(`   Valid: ${msg91Validation.isValid}`);
if (msg91Validation.errors.length > 0) {
  console.log('   Errors:');
  msg91Validation.errors.forEach(error => console.log(`     - ${error}`));
}
if (msg91Validation.warnings.length > 0) {
  console.log('   Warnings:');
  msg91Validation.warnings.forEach(warning => console.log(`     - ${warning}`));
}
console.log(`   Configured: ${isMSG91Configured()}`);
console.log();

// Test 3: Validate WhatsApp configuration
console.log('3. Validating WhatsApp configuration...');
const whatsappValidation = validateWhatsAppConfig();
console.log(`   Valid: ${whatsappValidation.isValid}`);
if (whatsappValidation.errors.length > 0) {
  console.log('   Errors:');
  whatsappValidation.errors.forEach(error => console.log(`     - ${error}`));
}
if (whatsappValidation.warnings.length > 0) {
  console.log('   Warnings:');
  whatsappValidation.warnings.forEach(warning => console.log(`     - ${warning}`));
}
console.log(`   Configured: ${isWhatsAppConfigured()}`);
console.log();

// Test 4: Validate all configurations
console.log('4. Validating all configurations...');
const allConfigs = validateAllCommunicationConfigs();
console.log(`   Has Errors: ${allConfigs.hasErrors}`);
console.log();

// Test 5: Try to get configuration objects
console.log('5. Attempting to get configuration objects...');

if (isMSG91Configured()) {
  try {
    const msg91Config = getMSG91Config();
    console.log('   MSG91 Config:');
    console.log(`     - Sender ID: ${msg91Config.senderId}`);
    console.log(`     - Route: ${msg91Config.route}`);
    console.log(`     - Country: ${msg91Config.country}`);
    console.log(`     - Auth Key: ${msg91Config.authKey.substring(0, 10)}...`);
  } catch (error) {
    console.error('   MSG91 Config Error:', (error as Error).message);
  }
} else {
  console.log('   MSG91: Not configured or not enabled');
}

if (isWhatsAppConfigured()) {
  try {
    const whatsappConfig = getWhatsAppConfig();
    console.log('   WhatsApp Config:');
    console.log(`     - Phone Number ID: ${whatsappConfig.phoneNumberId}`);
    console.log(`     - Business Account ID: ${whatsappConfig.businessAccountId}`);
    console.log(`     - API Version: ${whatsappConfig.apiVersion}`);
    console.log(`     - Access Token: ${whatsappConfig.accessToken.substring(0, 10)}...`);
  } catch (error) {
    console.error('   WhatsApp Config Error:', (error as Error).message);
  }
} else {
  console.log('   WhatsApp: Not configured or not enabled');
}
console.log();

// Test 6: Log full configuration status
console.log('6. Full configuration status:');
logCommunicationConfigStatus();

console.log('=== Test Complete ===');
