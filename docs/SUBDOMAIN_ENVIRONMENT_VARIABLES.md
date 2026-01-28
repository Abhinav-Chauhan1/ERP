# Subdomain System Environment Variables

This document describes all environment variables required for the subdomain system to function properly.

## Core Configuration

### `ROOT_DOMAIN` (Required)
Your main domain name without protocol or subdomains.

```env
ROOT_DOMAIN=sikshamitra.com
```

**Examples:**
- Production: `sikshamitra.com`
- Staging: `staging.sikshamitra.com`
- Development: `localhost` or `dev.sikshamitra.com`

### `SUBDOMAIN_ENABLED` (Optional)
Enable or disable subdomain functionality.

```env
SUBDOMAIN_ENABLED=true
```

**Default:** `false`
**Values:** `true` | `false`

### `NEXT_PUBLIC_ROOT_DOMAIN` (Required for Client-Side)
Client-side accessible version of ROOT_DOMAIN for UI display.

```env
NEXT_PUBLIC_ROOT_DOMAIN=sikshamitra.com
```

## DNS Provider Configuration

Choose one DNS provider and configure its specific variables.

### Cloudflare (Recommended)

```env
DNS_PROVIDER=cloudflare
DNS_API_KEY=your_cloudflare_api_token
DNS_ZONE_ID=your_cloudflare_zone_id
```

**How to get values:**
1. Go to Cloudflare Dashboard
2. Select your domain
3. Copy Zone ID from the right sidebar
4. Go to My Profile → API Tokens
5. Create token with `Zone:Edit` permissions

### DigitalOcean

```env
DNS_PROVIDER=digitalocean
DNS_API_KEY=your_digitalocean_api_token
```

**How to get values:**
1. Go to DigitalOcean Control Panel
2. Navigate to API → Generate New Token
3. Select read/write permissions
4. Copy the generated token

### AWS Route53

```env
DNS_PROVIDER=route53
DNS_API_KEY=your_aws_access_key_id
DNS_API_SECRET=your_aws_secret_access_key
DNS_REGION=us-east-1
```

**How to get values:**
1. Create IAM user with Route53 permissions
2. Generate access key and secret
3. Use the region where your hosted zone is located

### Namecheap (Coming Soon)

```env
DNS_PROVIDER=namecheap
DNS_API_KEY=your_namecheap_api_key
DNS_API_SECRET=your_namecheap_api_secret
```

## SSL Certificate Configuration

Choose one SSL provider and configure its specific variables.

### Let's Encrypt (Free, Recommended)

```env
SSL_PROVIDER=letsencrypt
SSL_EMAIL=admin@sikshamitra.com
SSL_STAGING=false
```

**Variables:**
- `SSL_EMAIL`: Email for Let's Encrypt account registration
- `SSL_STAGING`: Use staging environment for testing (`true` | `false`)

### Cloudflare SSL

```env
SSL_PROVIDER=cloudflare
SSL_API_KEY=your_cloudflare_api_token
```

**Note:** Uses the same API token as DNS configuration.

### AWS Certificate Manager

```env
SSL_PROVIDER=aws-acm
SSL_REGION=us-east-1
```

**Variables:**
- `SSL_REGION`: AWS region for certificate management

### Custom SSL Provider

```env
SSL_PROVIDER=custom
SSL_CERTIFICATE_PATH=/path/to/certificate.pem
SSL_PRIVATE_KEY_PATH=/path/to/private.key
SSL_CHAIN_PATH=/path/to/chain.pem
```

## Development Configuration

### Local Development with Subdomains

For local development, add these entries to your `/etc/hosts` file:

```
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 school1.localhost
127.0.0.1 school2.localhost
```

Then configure:

```env
ROOT_DOMAIN=localhost
NEXT_PUBLIC_ROOT_DOMAIN=localhost
NODE_ENV=development
```

### Development with Custom Domain

If using a custom development domain:

```env
ROOT_DOMAIN=dev.sikshamitra.com
NEXT_PUBLIC_ROOT_DOMAIN=dev.sikshamitra.com
NODE_ENV=development
```

## Production Configuration

### Complete Production Example

```env
# Core Configuration
ROOT_DOMAIN=sikshamitra.com
NEXT_PUBLIC_ROOT_DOMAIN=sikshamitra.com
SUBDOMAIN_ENABLED=true
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_URL=https://sikshamitra.com
NEXTAUTH_SECRET=your_super_secret_key_here

# DNS Configuration (Cloudflare)
DNS_PROVIDER=cloudflare
DNS_API_KEY=your_cloudflare_api_token
DNS_ZONE_ID=your_cloudflare_zone_id

# SSL Configuration (Let's Encrypt)
SSL_PROVIDER=letsencrypt
SSL_EMAIL=admin@sikshamitra.com
SSL_STAGING=false

# Other Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Environment-Specific Configurations

### Staging Environment

```env
ROOT_DOMAIN=staging.sikshamitra.com
NEXT_PUBLIC_ROOT_DOMAIN=staging.sikshamitra.com
SSL_STAGING=true
DNS_PROVIDER=cloudflare
# ... other staging-specific values
```

### Testing Environment

```env
ROOT_DOMAIN=test.sikshamitra.com
NEXT_PUBLIC_ROOT_DOMAIN=test.sikshamitra.com
SSL_STAGING=true
SUBDOMAIN_ENABLED=true
# ... other test-specific values
```

## Security Considerations

### API Key Security

1. **Never commit API keys to version control**
2. **Use environment-specific secrets management**
3. **Rotate API keys regularly**
4. **Use least-privilege access for API tokens**

### SSL Security

1. **Always use SSL_STAGING=false in production**
2. **Monitor certificate expiration dates**
3. **Use strong cipher suites**
4. **Enable HSTS headers**

## Validation and Testing

### Environment Validation Script

Create a script to validate your environment:

```bash
#!/bin/bash
# validate-env.sh

echo "Validating subdomain environment configuration..."

# Check required variables
required_vars=("ROOT_DOMAIN" "DNS_PROVIDER" "SSL_PROVIDER")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Check DNS provider specific variables
case $DNS_PROVIDER in
    "cloudflare")
        if [ -z "$DNS_API_KEY" ] || [ -z "$DNS_ZONE_ID" ]; then
            echo "❌ Cloudflare requires DNS_API_KEY and DNS_ZONE_ID"
            exit 1
        fi
        ;;
    "digitalocean")
        if [ -z "$DNS_API_KEY" ]; then
            echo "❌ DigitalOcean requires DNS_API_KEY"
            exit 1
        fi
        ;;
    "route53")
        if [ -z "$DNS_API_KEY" ] || [ -z "$DNS_API_SECRET" ]; then
            echo "❌ Route53 requires DNS_API_KEY and DNS_API_SECRET"
            exit 1
        fi
        ;;
esac

echo "✅ Environment configuration is valid"
```

### Testing Configuration

```bash
# Test subdomain system
npm run tsx scripts/test-subdomain-system.ts

# Test DNS configuration
curl -X POST https://your-domain.com/api/subdomain/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "verify", "schoolId": "test", "subdomain": "demo"}'
```

## Troubleshooting

### Common Issues

1. **DNS not propagating**
   - Check DNS_ZONE_ID is correct
   - Verify API token permissions
   - Wait for DNS propagation (up to 48 hours)

2. **SSL certificate issues**
   - Check SSL_EMAIL is valid
   - Verify domain ownership
   - Check rate limits for Let's Encrypt

3. **Subdomain routing not working**
   - Verify ROOT_DOMAIN matches your actual domain
   - Check middleware configuration
   - Ensure NEXT_PUBLIC_ROOT_DOMAIN is set

### Debug Mode

Enable debug logging:

```env
DEBUG=subdomain:*
LOG_LEVEL=debug
```

This will provide detailed logging for subdomain operations.

## Migration from Existing Setup

If migrating from an existing setup without subdomains:

1. **Backup your current configuration**
2. **Add new environment variables gradually**
3. **Test in staging environment first**
4. **Run migration scripts**
5. **Verify all existing functionality still works**

## Support

For issues with environment configuration:

1. Check the deployment guide: `docs/SUBDOMAIN_DEPLOYMENT_GUIDE.md`
2. Run the test script: `scripts/test-subdomain-system.ts`
3. Check application logs for specific error messages
4. Verify DNS propagation using online tools