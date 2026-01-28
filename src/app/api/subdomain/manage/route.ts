import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createDNSService } from '@/lib/services/dns-service';
import { createSSLService } from '@/lib/services/ssl-service';
import { z } from 'zod';

const manageSubdomainSchema = z.object({
  action: z.enum(['create', 'delete', 'verify', 'renew-ssl']),
  schoolId: z.string(),
  subdomain: z.string().optional(),
});

/**
 * POST /api/subdomain/manage
 * Manage subdomain infrastructure (DNS and SSL)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, schoolId, subdomain } = manageSubdomainSchema.parse(body);

    // Get school details
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const targetSubdomain = subdomain || school.subdomain;
    if (!targetSubdomain) {
      return NextResponse.json({ error: 'No subdomain specified' }, { status: 400 });
    }

    const dnsService = createDNSService();
    const sslService = createSSLService();

    let result: any = {};

    switch (action) {
      case 'create':
        // Create DNS records
        if (dnsService) {
          const dnsSuccess = await dnsService.createSubdomainRecords(targetSubdomain);
          result.dns = { success: dnsSuccess };

          if (dnsSuccess) {
            // Wait a bit for DNS propagation, then request SSL
            setTimeout(async () => {
              if (sslService) {
                const certificate = await sslService.requestCertificate(targetSubdomain);
                if (certificate) {
                  await sslService.storeCertificate(certificate);
                  await sslService.scheduleRenewal(certificate.domain, certificate.expiresAt);
                }
              }
            }, 30000); // 30 seconds
          }
        }

        result.message = 'Subdomain infrastructure creation initiated';
        break;

      case 'delete':
        // Delete DNS records
        if (dnsService) {
          const dnsSuccess = await dnsService.deleteSubdomainRecords(targetSubdomain);
          result.dns = { success: dnsSuccess };
        }

        result.message = 'Subdomain infrastructure deletion completed';
        break;

      case 'verify':
        // Verify DNS propagation and SSL status
        if (dnsService) {
          const dnsVerified = await dnsService.verifySubdomainPropagation(targetSubdomain);
          result.dns = { verified: dnsVerified };
        }

        if (sslService) {
          const sslValid = await sslService.validateCertificate(`${targetSubdomain}.${process.env.ROOT_DOMAIN}`);
          result.ssl = { valid: sslValid };
        }

        result.message = 'Subdomain verification completed';
        break;

      case 'renew-ssl':
        // Renew SSL certificate
        if (sslService) {
          const certificate = await sslService.renewCertificate(`${targetSubdomain}.${process.env.ROOT_DOMAIN}`);
          result.ssl = { 
            renewed: !!certificate,
            expiresAt: certificate?.expiresAt,
          };
        }

        result.message = 'SSL certificate renewal completed';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'SUBDOMAIN_INFRASTRUCTURE',
        resourceId: schoolId,
        changes: {
          action,
          subdomain: targetSubdomain,
          result,
        },
        checksum: `subdomain-manage-${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      subdomain: targetSubdomain,
      ...result,
    });
  } catch (error) {
    console.error('Error managing subdomain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}