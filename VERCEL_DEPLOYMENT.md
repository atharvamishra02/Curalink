# Vercel Deployment Steps

## Prerequisites
- GitHub account with your repository
- Vercel account (sign up at vercel.com)
- Neon PostgreSQL database
- Upstash Redis database

## Step 1: Prepare Environment Variables

You'll need these environment variables:
```
DATABASE_URL=postgresql://username:password@host/database
JWT_SECRET=your-secret-key-here
REDIS_URL=your-upstash-redis-url
REDIS_TOKEN=your-upstash-redis-token
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Build Command: `npm run vercel-build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from your `.env` file
   - Make sure to add them for all environments (Production, Preview, Development)

6. Click "Deploy"

### Option B: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and add environment variables when asked

5. For production deployment:
```bash
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| DATABASE_URL | Your Neon PostgreSQL URL | Production, Preview, Development |
| JWT_SECRET | Your secret key | Production, Preview, Development |
| REDIS_URL | Your Upstash Redis URL | Production, Preview, Development |
| REDIS_TOKEN | Your Upstash Redis Token | Production, Preview, Development |

## Step 4: Verify Deployment

1. Once deployed, Vercel will provide a URL (e.g., `your-app.vercel.app`)
2. Visit the URL and test:
   - User registration
   - Login
   - Profile updates
   - Admin dashboard (login as admin@gmail.com)

## Step 5: Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if Neon database allows connections from Vercel IPs
- Ensure database is not sleeping (Neon free tier)

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

### Prisma Issues
- The `vercel-build` script automatically runs:
  1. `prisma generate` - Generates Prisma Client
  2. `prisma db push` - Syncs schema with database
  3. `next build` - Builds Next.js app

### Redis Issues
- Verify REDIS_URL and REDIS_TOKEN are correct
- Check Upstash Redis dashboard for connection status

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch triggers a production deployment
- Every pull request creates a preview deployment
- You can disable auto-deployments in Project Settings

## Monitoring

- View deployment logs in Vercel dashboard
- Check function logs for API routes
- Monitor database queries in Neon dashboard
- Monitor Redis usage in Upstash dashboard

## Create Admin User After Deployment

After first deployment, create an admin user:

1. In Vercel dashboard, go to your project
2. Open the Functions tab
3. Create a serverless function or use API route:
   ```
   POST /api/auth/register
   {
     "name": "Admin User",
     "email": "admin@gmail.com",
     "password": "admin234",
     "role": "ADMIN"
   }
   ```

Or manually update the database to set a user's role to `ADMIN`.

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure database is accessible
