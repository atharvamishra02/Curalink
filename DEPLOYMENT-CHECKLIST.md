# Pre-Deployment Checklist ✅

Use this checklist to ensure your application is ready for deployment to Vercel.

## Local Testing

- [ ] Build passes locally (`npm run build`)
- [ ] All environment variables set in `.env`
- [ ] Database migrations completed (`npm run prisma:migrate`)
- [ ] Application runs in development mode (`npm run dev`)
- [ ] Application runs in production mode (`npm run build && npm start`)
- [ ] No console errors in browser
- [ ] Authentication works (login/register)
- [ ] Dashboard features work (patient & researcher)

## Code Quality

- [ ] No ESLint errors (`npm run lint`)
- [ ] All unused files removed
- [ ] Sensitive data not hardcoded
- [ ] `.env` file not committed (check `.gitignore`)
- [ ] No debugging console.logs in production code

## Database Setup

- [ ] PostgreSQL database created
- [ ] Connection string obtained
- [ ] Database accessible from external connections
- [ ] Prisma schema is up to date
- [ ] Migrations tested
- [ ] (Optional) Database seeded with initial data

## Redis Setup

- [ ] Redis instance created (Upstash recommended)
- [ ] Connection string obtained
- [ ] Redis accessible from external connections
- [ ] Test connection works

## Environment Variables

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Generated (min 32 chars)
- [ ] `REDIS_URL` - Redis connection string
- [ ] `PUBMED_API_KEY` - PubMed API key (optional)
- [ ] `NEXT_PUBLIC_API_URL` - Will be your Vercel URL

## Vercel Configuration

- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.example` file created
- [ ] `DEPLOYMENT.md` reviewed
- [ ] `vercel.json` exists
- [ ] Build script includes Prisma generation
- [ ] `postinstall` script configured

## Security

- [ ] JWT secret is strong (32+ characters)
- [ ] Database credentials are secure
- [ ] No API keys in client-side code
- [ ] CORS configured properly
- [ ] Rate limiting considered for API routes
- [ ] Input validation on all forms

## Documentation

- [ ] `README.md` complete
- [ ] `DEPLOYMENT.md` reviewed
- [ ] Environment variables documented
- [ ] API routes documented (if needed)

## Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Deploy to Vercel
- Import project in Vercel dashboard
- Set all environment variables (except `NEXT_PUBLIC_API_URL`)
- Deploy

### 3. Post-Deployment
- [ ] Update `NEXT_PUBLIC_API_URL` with actual Vercel URL
- [ ] Redeploy for environment variable changes
- [ ] Test all features in production
- [ ] Check logs for errors
- [ ] Verify database connection
- [ ] Test authentication flow
- [ ] Test all API endpoints

## Common Issues & Solutions

### Build Fails
- Check build logs in Vercel
- Verify all environment variables are set
- Ensure Prisma client generates correctly

### Database Connection Error
- Verify `DATABASE_URL` format
- Check database allows external connections
- Verify credentials are correct

### Redis Connection Error
- Verify `REDIS_URL` format
- Check Redis instance is running
- For Upstash, verify TLS settings

### 404 on API Routes
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check no trailing slash in URL
- Ensure environment variable is set for Production

### Authentication Fails
- Verify `JWT_SECRET` is set and consistent
- Check JWT token expiration settings
- Verify cookies are allowed

## Post-Launch Monitoring

- [ ] Monitor function execution times
- [ ] Check error rates in Vercel dashboard
- [ ] Monitor database connections
- [ ] Check Redis cache hit rates
- [ ] Monitor API rate limits
- [ ] Set up error tracking (optional: Sentry)
- [ ] Set up uptime monitoring (optional)

## Performance Optimization

- [ ] Enable image optimization
- [ ] Configure caching headers
- [ ] Use Redis for API caching
- [ ] Optimize database queries
- [ ] Add connection pooling for database
- [ ] Consider CDN for static assets

## Future Enhancements

- [ ] Set up CI/CD pipeline
- [ ] Add staging environment
- [ ] Configure custom domain
- [ ] Add monitoring and analytics
- [ ] Set up automated backups
- [ ] Add health check endpoint
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger)

---

**Last Updated:** January 2025

**Notes:**
- This checklist should be reviewed before each deployment
- Keep this file updated as new requirements emerge
- Share with team members for consistency
