# Production Subdomain Deployment Guide

This guide covers deploying the fully functional subdomain system to production.

## Prerequisites

- Domain name (e.g., `sikshamitra.com`)
- DNS provider account (Cloudflare, DigitalOcean, or AWS Route53)
- SSL certificate provider (Let's Encrypt, Cloudflare, or AWS ACM)
- Production server with Node.js 18+

## 1. DNS Configuration

### Option A: Cloudflare (Recommended)

1. **Add your domain to Cloudflare**
   ```bash
   # Get your Zone ID from Cloudflare dashboard
   ZONE_ID="your_zone_id_here"
   ```

2. **Create API token**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with `Zone:Edit` permissions
   - Save the token securely

3. **Configure environment variables**
   ```env
   DNS_PROVIDER=cloudflare
   DNS_API_KEY=your_cloudflare_api_token
   DNS_ZONE_ID=your_zone_id
   ROOT_DOMAIN=sikshamitra.com
   ```

### Option B: DigitalOcean

1. **Add domain to DigitalOcean**
   - Go to Networking → Domains
   - Add your domain

2. **Create API token**
   - Go to API → Generate New Token
   - Select read/write permissions

3. **Configure environment variables**
   ```env
   DNS_PROVIDER=digitalocean
   DNS_API_KEY=your_digitalocean_api_token
   ROOT_DOMAIN=sikshamitra.com
   ```

### Option C: AWS Route53

1. **Create hosted zone**
   ```bash
   aws route53 create-hosted-zone --name sikshamitra.com --caller-reference $(date +%s)
   ```

2. **Configure environment variables**
   ```env
   DNS_PROVIDER=route53
   DNS_API_KEY=your_aws_access_key_id
   DNS_API_SECRET=your_aws_secret_access_key
   DNS_REGION=us-east-1
   ROOT_DOMAIN=sikshamitra.com
   ```

## 2. SSL Configuration

### Option A: Let's Encrypt (Free)

```env
SSL_PROVIDER=letsencrypt
SSL_EMAIL=admin@sikshamitra.com
SSL_STAGING=false
```

### Option B: Cloudflare SSL

```env
SSL_PROVIDER=cloudflare
SSL_API_KEY=your_cloudflare_api_token
```

### Option C: AWS Certificate Manager

```env
SSL_PROVIDER=aws-acm
SSL_REGION=us-east-1
```

## 3. Application Configuration

### Environment Variables

Create `.env.production`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_URL=https://sikshamitra.com
NEXTAUTH_SECRET=your_super_secret_key

# Subdomain Configuration
ROOT_DOMAIN=sikshamitra.com
SUBDOMAIN_ENABLED=true

# DNS Provider (choose one)
DNS_PROVIDER=cloudflare
DNS_API_KEY=your_api_key
DNS_ZONE_ID=your_zone_id

# SSL Provider (choose one)
SSL_PROVIDER=letsencrypt
SSL_EMAIL=admin@sikshamitra.com
SSL_STAGING=false

# Other required variables
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Add domain to image configuration
  images: {
    remotePatterns: [
      // ... existing patterns
      {
        protocol: 'https',
        hostname: '*.sikshamitra.com',
      },
    ],
  },
}
```

## 4. Database Migration

Run the subdomain schema migration:

```bash
# Install dependencies
npm install

# Run database migration
npx prisma migrate deploy

# Run subdomain schema migration
npm run tsx scripts/migrate-subdomain-schema.ts
```

## 5. Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/sikshamitra`:

```nginx
# Main domain
server {
    listen 80;
    listen [::]:80;
    server_name sikshamitra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sikshamitra.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Wildcard subdomain
server {
    listen 80;
    listen [::]:80;
    server_name *.sikshamitra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name *.sikshamitra.com;

    ssl_certificate /path/to/wildcard/cert.pem;
    ssl_certificate_key /path/to/wildcard/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'sikshamitra',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }]
}
```

## 6. Deployment Steps

### 1. Build and Deploy

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Enable startup script
pm2 startup
pm2 save
```

### 2. Test the System

```bash
# Run system tests
npm run tsx scripts/test-subdomain-system.ts

# Create a test school
curl -X POST https://sikshamitra.com/api/super-admin/schools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "schoolName": "Demo School",
    "subdomain": "demo",
    "contactEmail": "admin@demo.com",
    "subscriptionPlan": "GROWTH",
    "billingCycle": "monthly"
  }'
```

### 3. Verify Subdomain Creation

```bash
# Check DNS propagation
dig demo.sikshamitra.com

# Check SSL certificate
curl -I https://demo.sikshamitra.com

# Test subdomain access
curl https://demo.sikshamitra.com
```

## 7. Monitoring and Maintenance

### Health Checks

Create monitoring endpoints:

```bash
# Check main domain
curl https://sikshamitra.com/api/health

# Check subdomain functionality
curl https://sikshamitra.com/api/subdomain/detect \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"hostname": "demo.sikshamitra.com"}'
```

### SSL Certificate Renewal

Set up automatic renewal:

```bash
# Add to crontab
0 2 * * * /path/to/your/app/scripts/renew-ssl-certificates.sh
```

### Log Monitoring

Monitor application logs:

```bash
# PM2 logs
pm2 logs sikshamitra

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 8. Troubleshooting

### Common Issues

1. **DNS not propagating**
   ```bash
   # Check DNS settings
   dig @8.8.8.8 demo.sikshamitra.com
   
   # Verify DNS provider configuration
   npm run tsx scripts/test-subdomain-system.ts
   ```

2. **SSL certificate issues**
   ```bash
   # Check certificate status
   openssl s_client -connect demo.sikshamitra.com:443 -servername demo.sikshamitra.com
   
   # Renew certificate manually
   curl -X POST https://sikshamitra.com/api/subdomain/manage \
     -H "Content-Type: application/json" \
     -d '{"action": "renew-ssl", "schoolId": "school_id", "subdomain": "demo"}'
   ```

3. **Subdomain routing issues**
   ```bash
   # Check middleware logs
   pm2 logs sikshamitra --lines 100
   
   # Test subdomain detection
   curl https://sikshamitra.com/api/subdomain/detect \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"hostname": "demo.sikshamitra.com"}'
   ```

### Performance Optimization

1. **Enable caching**
   - Configure Redis for session storage
   - Enable CDN for static assets
   - Implement database query caching

2. **Load balancing**
   - Use multiple server instances
   - Configure load balancer for subdomains
   - Implement health checks

3. **Database optimization**
   - Add indexes for subdomain queries
   - Optimize school lookup queries
   - Monitor query performance

## 9. Security Considerations

1. **SSL/TLS Configuration**
   - Use strong cipher suites
   - Enable HSTS headers
   - Configure proper certificate chain

2. **DNS Security**
   - Enable DNSSEC if supported
   - Use secure API tokens
   - Implement rate limiting

3. **Application Security**
   - Validate subdomain input
   - Implement CSRF protection
   - Use secure session configuration

## 10. Backup and Recovery

1. **Database backups**
   ```bash
   # Daily database backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **SSL certificate backups**
   ```bash
   # Backup certificates
   cp /path/to/ssl/* /backup/ssl/
   ```

3. **Configuration backups**
   ```bash
   # Backup environment and config files
   tar -czf config_backup_$(date +%Y%m%d).tar.gz .env* *.config.js
   ```

This completes the production deployment guide for the subdomain system. The system is now fully functional with automatic DNS management, SSL certificate provisioning, and proper tenant isolation.