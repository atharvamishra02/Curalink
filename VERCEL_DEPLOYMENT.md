# Vercel Deployment Guide for Curalink

## 🚀 Quick Deploy

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

## 📋 Pre-Deployment Checklist

### Required Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

#### Database
- `DATABASE_URL` - PostgreSQL connection string (use Vercel Postgres or external)

#### Redis
- `UPSTASH_REDIS_REST_URL` - Get from Upstash.com (free tier available)
- `UPSTASH_REDIS_REST_TOKEN` - Get from Upstash.com

#### Authentication
- `JWT_SECRET` - Random secure string (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_SECRET` - Random secure string
- `NEXTAUTH_URL` - Your Vercel domain (e.g., https://curalink.vercel.app)

#### AI (Optional but recommended)
- `GEMINI_API_KEY` - Get from Google AI Studio

#### External APIs (Optional)
- `AACT_USERNAME` - For clinical trials data
- `AACT_PASSWORD` - For clinical trials data
- `SERPAPI_KEY` - For Google Scholar integration

### Database Setup

#### Option 1: Vercel Postgres (Recommended)
```bash
# In Vercel Dashboard
1. Go to Storage tab
2. Create Postgres Database
3. Copy DATABASE_URL to environment variables
```

#### Option 2: External Database (Supabase, Railway, etc.)
```bash
# Use your external PostgreSQL URL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Redis Setup (Required for Caching)

#### Use Upstash (Recommended for Vercel)
```bash
1. Go to upstash.com
2. Create free Redis database
3. Copy REST URL and Token
4. Add to Vercel environment variables
```

## 🔧 Deployment Steps

### Step 1: Prepare Database
```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Step 2: Configure Vercel

Create `vercel.json` (already created):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

## ⚙️ Post-Deployment

### 1. Run Database Migrations
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add: PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Then run migrations via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

### 2. Test the Deployment
- Visit your Vercel URL
- Test login/signup
- Check API endpoints
- Verify Redis caching

### 3. Set up Custom Domain (Optional)
```bash
# In Vercel Dashboard
1. Go to Settings → Domains
2. Add your custom domain
3. Update NEXTAUTH_URL environment variable
```

## 🔍 Troubleshooting

### Build Errors

**Error: Prisma Client not generated**
```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```

**Error: Database connection failed**
```bash
# Check DATABASE_URL format
# Ensure SSL mode is enabled for production
DATABASE_URL="postgresql://...?sslmode=require"
```

### Runtime Errors

**Error: Redis connection failed**
```bash
# Verify Upstash credentials
# Check UPSTASH_REDIS_REST_URL and TOKEN
```

**Error: API timeout**
```bash
# Increase function timeout in vercel.json
"maxDuration": 30
```

## 📊 Performance Optimization

### Already Implemented ✅
- Redis caching (1-hour cache)
- Parallel API fetching
- Optimized database queries
- Pagination
- Response compression

### Vercel-Specific Optimizations
- Edge Functions for static content
- Image optimization with Next.js Image
- Automatic CDN distribution
- Serverless function caching

## 🔐 Security Checklist

- [ ] All environment variables set
- [ ] JWT_SECRET is strong and unique
- [ ] Database uses SSL connection
- [ ] CORS configured properly
- [ ] Rate limiting enabled (via Vercel)
- [ ] No sensitive data in code

## 📱 Monitoring

### Vercel Analytics
```bash
# Enable in Vercel Dashboard
Settings → Analytics → Enable
```

### Error Tracking
- Vercel automatically tracks errors
- View in Dashboard → Logs

## 🎉 You're Ready!

Your Curalink app is now deployed on Vercel with:
- ✅ Serverless API routes
- ✅ Redis caching for speed
- ✅ PostgreSQL database
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-scaling

### Access Your App
```
https://your-project.vercel.app
```

### Continuous Deployment
- Push to main branch → Auto-deploy
- Pull requests → Preview deployments
- Rollback anytime in Vercel Dashboard

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Upstash Docs: https://docs.upstash.com

---

**Note**: WebSocket functionality has been replaced with polling for Vercel compatibility. For real-time WebSocket support, consider deploying the Socket.io server separately on Railway, Render, or DigitalOcean.
