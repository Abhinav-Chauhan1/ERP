# Deployment Guide

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Storage
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
RESEND_API_KEY="re_your_key"

# SMS
MSG91_AUTH_KEY="your-msg91-key"

# Payment
RAZORPAY_KEY_ID="rzp_live_key"
RAZORPAY_KEY_SECRET="your-secret"

# Rate Limiting
UPSTASH_REDIS_URL="your-redis-url"
UPSTASH_REDIS_TOKEN="your-redis-token"
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to vercel.com
   - Import your Git repository
   - Configure project settings

2. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables

3. **Deploy**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

4. **Configure Custom Domain**
   - Add domain in Project Settings
   - Configure DNS records
   - Wait for SSL provisioning

### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t sikshamitra-erp .
docker run -p 3000:3000 sikshamitra-erp
```

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04
   - t3.medium or larger

2. **Install Dependencies**
   ```bash
   sudo apt update
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs postgresql-client nginx
   sudo npm install -g pm2
   ```

3. **Deploy Application**
   ```bash
   git clone your-repo
   cd sikshamitra-erp
   npm install
   npm run build
   pm2 start npm --name "sikshamitra" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

5. **Setup SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Security headers set

### Performance
- [ ] CDN configured
- [ ] Database indexes created
- [ ] Caching enabled
- [ ] Image optimization configured

### Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup

### Testing
- [ ] Health check working
- [ ] Authentication tested
- [ ] Payment gateway tested
- [ ] Email delivery tested
- [ ] SMS delivery tested

## Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
```

### Log Monitoring

```bash
# PM2 logs
pm2 logs sikshamitra

# Application logs
tail -f logs/app.log
```

## Troubleshooting

### Application Won't Start
```bash
pm2 logs sikshamitra --lines 100
pm2 restart sikshamitra
```

### Database Connection Issues
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### High Memory Usage
```bash
pm2 restart sikshamitra
pm2 start npm --name "sikshamitra" --max-memory-restart 1G -- start
```

## Rollback Procedure

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

---

**Last Updated**: February 2026  
**Version**: 2.0.0
