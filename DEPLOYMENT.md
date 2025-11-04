# Curalink Deployment Guide for Vercel

This guide will help you deploy the Curalink application to Vercel.

## Prerequisites

Before deploying, ensure you have:
- A Vercel account (sign up at https://vercel.com)
- A GitHub/GitLab/Bitbucket account with your repository
- PostgreSQL database (Vercel Postgres or external)
- Redis instance (Upstash Redis recommended)
- PubMed API key (optional, for enhanced rate limits)

## Step 1: Prepare Your Repository

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Verify `.gitignore`:**
   - Ensure `.env` files are excluded (already configured)
   - Confirm `node_modules` and `.next` are ignored

## Step 2: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Select your project (or create new)
3. Go to "Storage" tab
4. Click "Create Database" → "Postgres"
5. Copy the `DATABASE_URL` connection string

### Option B: External PostgreSQL

1. Use any PostgreSQL provider (Railway, Supabase, AWS RDS, etc.)
2. Create a database named `curalink`
3. Get the connection string in format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
   ```

## Step 3: Set Up Redis

### Using Upstash Redis (Recommended for Vercel)

1. Go to https://upstash.com
2. Create a free account
3. Create a new Redis database
4. Copy the `REDIS_URL` connection string

## Step 4: Generate JWT Secret

Run this command to generate a secure JWT secret:

**PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32

Copy the generated string for use as `JWT_SECRET`.

## Step 5: Deploy to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. **Import Project:**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables:**
   - In the deployment setup, add these environment variables:
     
     | Name | Value | Notes |
     |------|-------|-------|
     | `DATABASE_URL` | Your PostgreSQL connection string | From Step 2 |
     | `JWT_SECRET` | Your generated secret | From Step 4 |
     | `REDIS_URL` | Your Redis connection string | From Step 3 |
     | `PUBMED_API_KEY` | Your PubMed API key | Optional |
     | `NEXT_PUBLIC_API_URL` | Your Vercel app URL | e.g., `https://curalink.vercel.app` |

   **Important:** For `NEXT_PUBLIC_API_URL`, you can use:
   - Leave blank initially, then add after first deployment
   - Or use format: `https://your-project-name.vercel.app`

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

4. **Run Database Migrations:**
   - After first deployment, go to your project settings
   - Navigate to "Deployments" tab
   - Find your latest deployment → Click "..." → "Redeploy"
   - Or run migrations manually using Vercel CLI (see Method 2)

### Method 2: Vercel CLI

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Login:**
   ```powershell
   vercel login
   ```

3. **Link Project:**
   ```powershell
   vercel link
   ```

4. **Add Environment Variables:**
   ```powershell
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add REDIS_URL
   vercel env add PUBMED_API_KEY
   vercel env add NEXT_PUBLIC_API_URL
   ```

5. **Deploy:**
   ```powershell
   vercel --prod
   ```

6. **Run Migrations:**
   ```powershell
   # After deployment, run migrations
   vercel env pull
   npm run prisma:migrate
   ```

## Step 6: Post-Deployment Setup

1. **Update `NEXT_PUBLIC_API_URL`:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your actual Vercel URL
   - Example: `https://curalink.vercel.app`
   - Redeploy for changes to take effect

2. **Seed Database (Optional):**
   - If you need initial data, run:
     ```powershell
     vercel env pull
     npm run prisma:seed
     ```

3. **Verify Deployment:**
   - Visit your Vercel URL
   - Test user registration
   - Test login functionality
   - Check researcher and patient dashboards

## Step 7: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_API_URL` to your custom domain

## Troubleshooting

### Build Fails with Prisma Error
- **Issue:** Prisma client not generated
- **Solution:** This should be handled by `postinstall` script, but if it fails:
  - Check that `DATABASE_URL` is set in environment variables
  - Verify `prisma/schema.prisma` exists
  - Check build logs for specific errors

### Database Connection Error
- **Issue:** Can't connect to database
- **Solution:** 
  - Verify `DATABASE_URL` format is correct
  - Ensure database is accessible from Vercel (check firewall rules)
  - For Vercel Postgres, ensure it's in the same region

### Redis Connection Error
- **Issue:** Can't connect to Redis
- **Solution:**
  - Verify `REDIS_URL` is correct
  - Check Redis instance is running
  - For Upstash, verify TLS settings

### JWT Secret Error
- **Issue:** Authentication fails
- **Solution:**
  - Ensure `JWT_SECRET` is set and at least 32 characters
  - Don't use spaces or special characters that need escaping

### API Routes Return 404
- **Issue:** API endpoints not working
- **Solution:**
  - Ensure `NEXT_PUBLIC_API_URL` points to your Vercel deployment
  - Check that it doesn't have trailing slash
  - Verify environment variable is set for "Production" environment

## Monitoring and Maintenance

### View Logs
```powershell
vercel logs [deployment-url]
```

### Monitor Performance
- Go to Vercel Dashboard → Analytics
- Check function execution times
- Monitor error rates

### Update Environment Variables
1. Go to Project Settings → Environment Variables
2. Edit the variable
3. Redeploy for changes to take effect

## Environment-Specific Configuration

Vercel supports three environments:
- **Production:** Main deployment (from `main` branch)
- **Preview:** Pull request deployments
- **Development:** Local development

You can set different values for each environment in the Vercel dashboard.

## Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong JWT secrets** - At least 32 characters, randomly generated
3. **Enable connection pooling** - For PostgreSQL in serverless environments
4. **Monitor function execution** - Serverless functions have time limits
5. **Use Redis caching** - Reduce database queries and external API calls
6. **Set up error tracking** - Use Sentry or similar services
7. **Regular backups** - Set up automatic database backups

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Upstash Redis](https://docs.upstash.com/redis)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review function logs for specific errors
3. Verify all environment variables are set correctly
4. Check database and Redis connectivity

---

**Last Updated:** January 2025
**Application Version:** 1.0.0
