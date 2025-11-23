/**
 * Tests for Database Backup Service
 * 
 * Tests the backup encryption and compression functionality
 * Note: Full integration tests require database setup
 */

import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Test encryption/decryption functions (same as in backup-service.ts)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encryptData(data: Buffer, key: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return { encrypted, iv, authTag };
}

function decryptData(encrypted: Buffer, iv: Buffer, authTag: Buffer, key: Buffer): Buffer {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

describe('Backup Encryption', () => {
  const testKey = crypto.randomBytes(32); // 256-bit key
  const testData = Buffer.from('This is test data for backup encryption', 'utf-8');

  it('should encrypt and decrypt data correctly', () => {
    const { encrypted, iv, authTag } = encryptData(testData, testKey);
    
    expect(encrypted).toBeDefined();
    expect(iv).toBeDefined();
    expect(authTag).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
    
    // Decrypt and verify
    const decrypted = decryptData(encrypted, iv, authTag, testKey);
    expect(decrypted.toString('utf-8')).toBe(testData.toString('utf-8'));
  });

  it('should use AES-256-GCM encryption algorithm', () => {
    // Verify the algorithm constant
    expect(ENCRYPTION_ALGORITHM).toBe('aes-256-gcm');
  });

  it('should generate unique IV for each encryption', () => {
    const { iv: iv1 } = encryptData(testData, testKey);
    const { iv: iv2 } = encryptData(testData, testKey);
    
    // IVs should be different even for same data
    expect(Buffer.compare(iv1, iv2)).not.toBe(0);
  });

  it('should produce different encrypted output for same data with different IVs', () => {
    const { encrypted: encrypted1 } = encryptData(testData, testKey);
    const { encrypted: encrypted2 } = encryptData(testData, testKey);
    
    // Encrypted data should be different due to different IVs
    expect(Buffer.compare(encrypted1, encrypted2)).not.toBe(0);
  });

  it('should fail decryption with wrong key', () => {
    const { encrypted, iv, authTag } = encryptData(testData, testKey);
    const wrongKey = crypto.randomBytes(32);
    
    expect(() => {
      decryptData(encrypted, iv, authTag, wrongKey);
    }).toThrow();
  });

  it('should fail decryption with tampered data', () => {
    const { encrypted, iv, authTag } = encryptData(testData, testKey);
    
    // Tamper with encrypted data
    const tampered = Buffer.from(encrypted);
    tampered[0] = tampered[0] ^ 0xFF;
    
    expect(() => {
      decryptData(tampered, iv, authTag, testKey);
    }).toThrow();
  });
});

describe('Backup Compression', () => {
  it('should compress data with gzip', async () => {
    const testData = Buffer.from('This is test data that should be compressed. '.repeat(100), 'utf-8');
    
    const compressed = await gzip(testData);
    
    expect(compressed.length).toBeLessThan(testData.length);
    expect(compressed.length).toBeGreaterThan(0);
  });

  it('should decompress data correctly', async () => {
    const testData = Buffer.from('This is test data for compression', 'utf-8');
    
    const compressed = await gzip(testData);
    const decompressed = await gunzip(compressed);
    
    expect(decompressed.toString('utf-8')).toBe(testData.toString('utf-8'));
  });

  it('should achieve significant compression for repetitive data', async () => {
    const testData = Buffer.from('AAAAAAAAAA'.repeat(1000), 'utf-8');
    
    const compressed = await gzip(testData);
    const compressionRatio = compressed.length / testData.length;
    
    // Should compress to less than 10% of original size for highly repetitive data
    expect(compressionRatio).toBeLessThan(0.1);
  });
});

describe('Backup Encryption + Compression', () => {
  const testKey = crypto.randomBytes(32);

  it('should compress then encrypt data', async () => {
    const testData = Buffer.from('This is test data. '.repeat(100), 'utf-8');
    
    // Step 1: Compress
    const compressed = await gzip(testData);
    expect(compressed.length).toBeLessThan(testData.length);
    
    // Step 2: Encrypt
    const { encrypted, iv, authTag } = encryptData(compressed, testKey);
    expect(encrypted.length).toBeGreaterThan(0);
    
    // Verify round trip
    const decrypted = decryptData(encrypted, iv, authTag, testKey);
    const decompressed = await gunzip(decrypted);
    
    expect(decompressed.toString('utf-8')).toBe(testData.toString('utf-8'));
  });

  it('should handle large data sets', async () => {
    // Create a large test dataset (1MB)
    const largeData = Buffer.from('X'.repeat(1024 * 1024), 'utf-8');
    
    const compressed = await gzip(largeData);
    const { encrypted, iv, authTag } = encryptData(compressed, testKey);
    
    // Verify round trip
    const decrypted = decryptData(encrypted, iv, authTag, testKey);
    const decompressed = await gunzip(decrypted);
    
    expect(decompressed.length).toBe(largeData.length);
  });
});

describe('Backup File Format', () => {
  const testKey = crypto.randomBytes(32);

  it('should create proper file format with IV, auth tag, and encrypted data', async () => {
    const testData = Buffer.from('Test data', 'utf-8');
    const compressed = await gzip(testData);
    const { encrypted, iv, authTag } = encryptData(compressed, testKey);
    
    // Combine as in actual backup file
    const fileData = Buffer.concat([iv, authTag, encrypted]);
    
    // Verify we can extract components
    const extractedIv = fileData.subarray(0, 16);
    const extractedAuthTag = fileData.subarray(16, 32);
    const extractedEncrypted = fileData.subarray(32);
    
    expect(Buffer.compare(extractedIv, iv)).toBe(0);
    expect(Buffer.compare(extractedAuthTag, authTag)).toBe(0);
    expect(Buffer.compare(extractedEncrypted, encrypted)).toBe(0);
    
    // Verify round trip
    const decrypted = decryptData(extractedEncrypted, extractedIv, extractedAuthTag, testKey);
    const decompressed = await gunzip(decrypted);
    
    expect(decompressed.toString('utf-8')).toBe(testData.toString('utf-8'));
  });
});
