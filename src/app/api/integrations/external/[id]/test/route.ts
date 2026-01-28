import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20, // Very restrictive for integration testing
};

/**
 * POST /api/integrations/external/[id]/test
 * Test an external integration connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await configurationService.getExternalIntegrationById(params.id);
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Test the integration connection
    const testResult = await testIntegrationConnection(integration);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'EXTERNAL_INTEGRATION',
      resourceId: params.id,
      changes: {
        action: 'test_connection',
        success: testResult.success,
        error: testResult.error,
      },
    });

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing external integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Test integration connection based on provider
 */
async function testIntegrationConnection(integration: any): Promise<{
  success: boolean;
  message: string;
  error?: string;
  details?: any;
}> {
  try {
    switch (integration.provider) {
      case 'stripe':
        return await testStripeConnection(integration.config);
      case 'datadog':
        return await testDataDogConnection(integration.config);
      case 'newrelic':
        return await testNewRelicConnection(integration.config);
      case 'pingdom':
        return await testPingdomConnection(integration.config);
      case 'uptimerobot':
        return await testUptimeRobotConnection(integration.config);
      case 'slack':
        return await testSlackConnection(integration.config);
      case 'discord':
        return await testDiscordConnection(integration.config);
      case 'email':
        return await testEmailConnection(integration.config);
      default:
        return {
          success: false,
          message: `Testing not implemented for provider: ${integration.provider}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Stripe connection
 */
async function testStripeConnection(config: any): Promise<any> {
  try {
    // This would use the actual Stripe SDK to test the connection
    // For now, we'll simulate a test
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (response.ok) {
      const account = await response.json();
      return {
        success: true,
        message: 'Stripe connection successful',
        details: {
          accountId: account.id,
          country: account.country,
          currency: account.default_currency,
        },
      };
    } else {
      return {
        success: false,
        message: 'Stripe connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Stripe connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test DataDog connection
 */
async function testDataDogConnection(config: any): Promise<any> {
  try {
    const response = await fetch('https://api.datadoghq.com/api/v1/validate', {
      headers: {
        'DD-API-KEY': config.apiKey,
        'DD-APPLICATION-KEY': config.appKey,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'DataDog connection successful',
      };
    } else {
      return {
        success: false,
        message: 'DataDog connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'DataDog connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test New Relic connection
 */
async function testNewRelicConnection(config: any): Promise<any> {
  try {
    const response = await fetch(`https://api.newrelic.com/v2/accounts/${config.accountId}.json`, {
      headers: {
        'X-Api-Key': config.apiKey,
      },
    });

    if (response.ok) {
      const account = await response.json();
      return {
        success: true,
        message: 'New Relic connection successful',
        details: {
          accountName: account.account?.name,
        },
      };
    } else {
      return {
        success: false,
        message: 'New Relic connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'New Relic connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Pingdom connection
 */
async function testPingdomConnection(config: any): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiKey}`).toString('base64');
    const response = await fetch('https://api.pingdom.com/api/3.1/checks', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Pingdom connection successful',
      };
    } else {
      return {
        success: false,
        message: 'Pingdom connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Pingdom connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test UptimeRobot connection
 */
async function testUptimeRobotConnection(config: any): Promise<any> {
  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getAccountDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `api_key=${config.apiKey}&format=json`,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.stat === 'ok') {
        return {
          success: true,
          message: 'UptimeRobot connection successful',
          details: {
            email: data.account?.email,
          },
        };
      } else {
        return {
          success: false,
          message: 'UptimeRobot connection failed',
          error: data.error?.message || 'API returned error status',
        };
      }
    } else {
      return {
        success: false,
        message: 'UptimeRobot connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'UptimeRobot connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Slack connection
 */
async function testSlackConnection(config: any): Promise<any> {
  try {
    if (config.webhookUrl) {
      // Test webhook URL
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test message from SaaS platform - connection successful!',
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Slack webhook connection successful',
        };
      } else {
        return {
          success: false,
          message: 'Slack webhook connection failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } else if (config.botToken) {
      // Test bot token
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${config.botToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            success: true,
            message: 'Slack bot connection successful',
            details: {
              team: data.team,
              user: data.user,
            },
          };
        } else {
          return {
            success: false,
            message: 'Slack bot connection failed',
            error: data.error || 'API returned error status',
          };
        }
      } else {
        return {
          success: false,
          message: 'Slack bot connection failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } else {
      return {
        success: false,
        message: 'No Slack webhook URL or bot token configured',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Slack connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Discord connection
 */
async function testDiscordConnection(config: any): Promise<any> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message from SaaS platform - connection successful!',
      }),
    });

    if (response.ok || response.status === 204) {
      return {
        success: true,
        message: 'Discord webhook connection successful',
      };
    } else {
      return {
        success: false,
        message: 'Discord webhook connection failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Discord connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Email connection
 */
async function testEmailConnection(config: any): Promise<any> {
  try {
    // This would use nodemailer or similar to test SMTP connection
    // For now, we'll simulate a basic validation
    const requiredFields = ['smtpHost', 'smtpPort', 'username', 'password'];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: 'Email configuration incomplete',
        error: `Missing fields: ${missingFields.join(', ')}`,
      };
    }

    // In a real implementation, you would create an SMTP connection and test it
    return {
      success: true,
      message: 'Email configuration appears valid (SMTP test not implemented)',
      details: {
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.secure || false,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Email connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}