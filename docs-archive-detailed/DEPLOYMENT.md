# Deployment Guide

## Overview

This guide covers deploying SikshaMitra ERP to production environments including Vercel, AWS, and self-hosted solutions.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ database
- Domain name configured
- SSL certificate (for custom domains)
- Environment variables configured

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (Resend)
RESEND_API_KEY="re_your_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# SMS (MSG91)
MSG91_AUTH_KEY="your-msg91-key"
MSG91_SENDER_ID="SCHOOL"

# Payment (Razorpay)
RAZORPAY_KEY_ID="rzp_live_key"
RAZORPAY_KEY_SECRET="your-secret"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_URL="your-redis-url"
UPSTASH_REDIS_TOKEN="your-redis-token"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"
```

### Optional Variables

```env
# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID="your-account-id"
WHATSAPP_ACCESS_TOKEN="your-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-id"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository
```bash
# Ensure your code is in a Git repository
git init
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your repository
4. Configure project settings

#### Step 3: Configure Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Separate variables for Production, Preview, and Development

#### Step 4: Configure Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

#### Step 5: Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Step 6: Configure Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Option 2: AWS (EC2 + RDS)

#### Step 1: Setup RDS Database
```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier sikshamitra-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username admin \
  --master-user-password YourPassword \
  --allocated-storage 100
```

#### Step 2: Launch EC2 Instance
```bash
# Launch Ubuntu 22.04 instance
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx
```

#### Step 3: Setup Server
```bash
# SSH into server
ssh -i your-key.pem ubuntu@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL client
sudo apt install -y postgresql-client
```

#### Step 4: Deploy Application
```bash
# Clone repository
git clone your-repo-url
cd sikshamitra-erp

# Install dependencies
npm install

# Create .env file
nano .env
# Add all environment variables

# Build application
npm run build

# Start with PM2
pm2 start npm --name "sikshamitra" -- start
pm2 save
pm2 startup
```

#### Step 5: Configure Nginx
```nginx
# /etc/nginx/sites-available/sikshamitra
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sikshamitra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Option 3: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=sikshamitra
      - POSTGRES_PASSWORD=your_password
      - POSTGRES_DB=sikshamitra_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Step 3: Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Database Migration

### Production Migration
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

### Backup Before Migration
```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore if needed
psql $DATABASE_URL < backup-20260209.sql
```

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers set

### Performance
- [ ] CDN configured for static assets
- [ ] Database indexes created
- [ ] Caching enabled
- [ ] Image optimization configured
- [ ] Compression enabled

### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup
- [ ] Backup automation configured

### Testing
- [ ] Health check endpoint working
- [ ] Authentication flow tested
- [ ] Payment gateway tested
- [ ] Email delivery tested
- [ ] SMS delivery tested
- [ ] File upload tested

## Monitoring & Maintenance

### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
  };
  
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks
  });
}
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs sikshamitra

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f logs/app.log
```

### Database Backup
```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### Performance Monitoring
```bash
# Server resources
htop

# Database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Application metrics
pm2 monit
```

## Scaling

### Horizontal Scaling
1. Deploy multiple application instances
2. Setup load balancer (AWS ALB, Nginx)
3. Use shared session storage (Redis)
4. Configure sticky sessions if needed

### Database Scaling
1. Setup read replicas for reporting
2. Implement connection pooling
3. Optimize slow queries
4. Consider database sharding for large deployments

### CDN Configuration
1. Configure CloudFront or Cloudflare
2. Cache static assets
3. Enable image optimization
4. Setup cache invalidation

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs sikshamitra --lines 100

# Check environment variables
pm2 env sikshamitra

# Restart application
pm2 restart sikshamitra
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### High Memory Usage
```bash
# Check memory
free -h

# Restart application
pm2 restart sikshamitra

# Increase memory limit
pm2 start npm --name "sikshamitra" --max-memory-restart 1G -- start
```

## Rollback Procedure

### Quick Rollback
```bash
# Vercel
vercel rollback

# PM2
pm2 stop sikshamitra
git checkout previous-commit
npm install
npm run build
pm2 restart sikshamitra
```

### Database Rollback
```bash
# Restore from backup
psql $DATABASE_URL < backup-20260209.sql

# Or rollback migrations
npx prisma migrate resolve --rolled-back migration_name
```

## Support

For deployment issues:
- Documentation: [docs/](docs/)
- Email: support@sikshamitra.com
- Status Page: status.sikshamitra.com

---

**Last Updated**: February 2026  
**Version**: 2.0.0
