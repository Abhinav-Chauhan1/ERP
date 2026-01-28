import { z } from 'zod';

// DNS Provider Types
export type DNSProvider = 'cloudflare' | 'route53' | 'digitalocean' | 'namecheap';

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
}

interface DNSProviderConfig {
  provider: DNSProvider;
  apiKey: string;
  apiSecret?: string;
  zoneId?: string;
  domain: string;
}

/**
 * Abstract DNS Service for managing subdomain DNS records
 */
export class DNSService {
  private config: DNSProviderConfig;

  constructor(config: DNSProviderConfig) {
    this.config = config;
  }

  /**
   * Create DNS records for a new subdomain
   */
  async createSubdomainRecords(subdomain: string): Promise<boolean> {
    try {
      const records: DNSRecord[] = [
        {
          type: 'CNAME',
          name: subdomain,
          content: this.config.domain,
          ttl: 300,
        },
        // Add TXT record for verification
        {
          type: 'TXT',
          name: `_verification.${subdomain}`,
          content: `sikshamitra-verification=${this.generateVerificationToken(subdomain)}`,
          ttl: 300,
        },
      ];

      for (const record of records) {
        await this.createRecord(record);
      }

      return true;
    } catch (error) {
      console.error('Error creating subdomain DNS records:', error);
      return false;
    }
  }

  /**
   * Delete DNS records for a subdomain
   */
  async deleteSubdomainRecords(subdomain: string): Promise<boolean> {
    try {
      await this.deleteRecord('CNAME', subdomain);
      await this.deleteRecord('TXT', `_verification.${subdomain}`);
      return true;
    } catch (error) {
      console.error('Error deleting subdomain DNS records:', error);
      return false;
    }
  }

  /**
   * Verify subdomain DNS propagation
   */
  async verifySubdomainPropagation(subdomain: string): Promise<boolean> {
    try {
      const fullDomain = `${subdomain}.${this.config.domain}`;
      
      // Use DNS lookup to verify the record exists
      const response = await fetch(`https://dns.google/resolve?name=${fullDomain}&type=CNAME`);
      const data = await response.json();
      
      return data.Status === 0 && data.Answer && data.Answer.length > 0;
    } catch (error) {
      console.error('Error verifying subdomain propagation:', error);
      return false;
    }
  }

  /**
   * Create a DNS record based on provider
   */
  private async createRecord(record: DNSRecord): Promise<void> {
    switch (this.config.provider) {
      case 'cloudflare':
        await this.createCloudflareRecord(record);
        break;
      case 'route53':
        await this.createRoute53Record(record);
        break;
      case 'digitalocean':
        await this.createDigitalOceanRecord(record);
        break;
      case 'namecheap':
        await this.createNamecheapRecord(record);
        break;
      default:
        throw new Error(`Unsupported DNS provider: ${this.config.provider}`);
    }
  }

  /**
   * Delete a DNS record based on provider
   */
  private async deleteRecord(type: string, name: string): Promise<void> {
    switch (this.config.provider) {
      case 'cloudflare':
        await this.deleteCloudflareRecord(type, name);
        break;
      case 'route53':
        await this.deleteRoute53Record(type, name);
        break;
      case 'digitalocean':
        await this.deleteDigitalOceanRecord(type, name);
        break;
      case 'namecheap':
        await this.deleteNamecheapRecord(type, name);
        break;
      default:
        throw new Error(`Unsupported DNS provider: ${this.config.provider}`);
    }
  }

  /**
   * Cloudflare DNS API implementation
   */
  private async createCloudflareRecord(record: DNSRecord): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl || 300,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }
  }

  private async deleteCloudflareRecord(type: string, name: string): Promise<void> {
    // First, get the record ID
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records?type=${type}&name=${name}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to list DNS records');
    }

    const listData = await listResponse.json();
    const records = listData.result;

    for (const record of records) {
      const deleteResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete DNS record');
      }
    }
  }

  /**
   * AWS Route53 DNS API implementation
   */
  private async createRoute53Record(record: DNSRecord): Promise<void> {
    // Implementation for AWS Route53
    // This would require AWS SDK integration
    throw new Error('Route53 implementation not yet available');
  }

  private async deleteRoute53Record(type: string, name: string): Promise<void> {
    // Implementation for AWS Route53
    throw new Error('Route53 implementation not yet available');
  }

  /**
   * DigitalOcean DNS API implementation
   */
  private async createDigitalOceanRecord(record: DNSRecord): Promise<void> {
    const response = await fetch(
      `https://api.digitalocean.com/v2/domains/${this.config.domain}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: record.type,
          name: record.name,
          data: record.content,
          ttl: record.ttl || 300,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DigitalOcean API error: ${error.message || 'Unknown error'}`);
    }
  }

  private async deleteDigitalOceanRecord(type: string, name: string): Promise<void> {
    // First, get all records and find the one to delete
    const listResponse = await fetch(
      `https://api.digitalocean.com/v2/domains/${this.config.domain}/records`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to list DNS records');
    }

    const listData = await listResponse.json();
    const records = listData.domain_records.filter(
      (r: any) => r.type === type && r.name === name
    );

    for (const record of records) {
      const deleteResponse = await fetch(
        `https://api.digitalocean.com/v2/domains/${this.config.domain}/records/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete DNS record');
      }
    }
  }

  /**
   * Namecheap DNS API implementation
   */
  private async createNamecheapRecord(record: DNSRecord): Promise<void> {
    // Implementation for Namecheap
    // This would require Namecheap API integration
    throw new Error('Namecheap implementation not yet available');
  }

  private async deleteNamecheapRecord(type: string, name: string): Promise<void> {
    // Implementation for Namecheap
    throw new Error('Namecheap implementation not yet available');
  }

  /**
   * Generate verification token for subdomain
   */
  private generateVerificationToken(subdomain: string): string {
    const timestamp = Date.now().toString();
    const data = `${subdomain}-${timestamp}-${process.env.NEXTAUTH_SECRET}`;
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

/**
 * Factory function to create DNS service instance
 */
export function createDNSService(): DNSService | null {
  const provider = process.env.DNS_PROVIDER as DNSProvider;
  const apiKey = process.env.DNS_API_KEY;
  const apiSecret = process.env.DNS_API_SECRET;
  const zoneId = process.env.DNS_ZONE_ID;
  const domain = process.env.ROOT_DOMAIN;

  if (!provider || !apiKey || !domain) {
    console.warn('DNS service not configured. Subdomain DNS management will be disabled.');
    return null;
  }

  return new DNSService({
    provider,
    apiKey,
    apiSecret,
    zoneId,
    domain,
  });
}