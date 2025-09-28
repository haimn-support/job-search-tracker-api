# Cloud Deployment Guide

This guide will help you deploy your Job Search Tracker application to the cloud using free tier services.

## Architecture Overview

- **Database**: Supabase (PostgreSQL) - Free tier with 500MB storage
- **Backend API**: Render - Free tier with 750 hours/month
- **Frontend**: Render Static Site - Free tier with 100GB bandwidth/month

## Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string (it will look like: `postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres`)
5. Note down your project reference and password

## Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) and create a free account
2. Connect your GitHub account
3. Click "New" → "Web Service"
4. Connect your `job-search-tracker-api` repository
5. Configure the service:
   - **Name**: `job-search-tracker-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips "*"`
   - **Health Check Path**: `/health`

6. Set environment variables in Render dashboard:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_REF].supabase.co:5432/postgres
   SECRET_KEY=[GENERATE_A_SECURE_SECRET_KEY]
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.onrender.com"]
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=INFO
   ```

7. Deploy the service
8. Note the URL (e.g., `https://job-search-tracker-api.onrender.com`)

## Step 3: Deploy Frontend to Render

1. In Render dashboard, click "New" → "Static Site"
2. Connect your `job-search-tracker-frontend` repository
3. Configure the static site:
   - **Name**: `job-search-tracker-frontend`
   - **Build Command**: `npm ci && npm run build:production`
   - **Publish Directory**: `build`

4. Set environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   REACT_APP_ENVIRONMENT=production
   ```

5. Deploy the static site
6. Note the URL (e.g., `https://job-search-tracker-frontend.onrender.com`)

## Step 4: Update CORS Settings

1. Go back to your backend service in Render
2. Update the `BACKEND_CORS_ORIGINS` environment variable:
   ```
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.onrender.com"]
   ```
3. Redeploy the backend service

## Step 5: Test the Deployment

1. Visit your frontend URL
2. Test the application functionality
3. Check the backend API documentation at `https://your-backend-domain.onrender.com/docs`

## Alternative: Vercel Deployment (Frontend Only)

If you prefer Vercel for the frontend:

1. Go to [vercel.com](https://vercel.com) and create a free account
2. Import your frontend repository
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   ```
4. Deploy

## Troubleshooting

### Database Connection Issues
- Verify the DATABASE_URL format
- Check Supabase project is active
- Ensure database is accessible from external connections

### CORS Issues
- Update BACKEND_CORS_ORIGINS with exact frontend URL
- Include both HTTP and HTTPS if needed
- Check for trailing slashes in URLs

### Build Failures
- Check build logs in Render dashboard
- Verify all dependencies are in requirements.txt/package.json
- Ensure environment variables are set correctly

## Free Tier Limits

- **Supabase**: 500MB database storage, 2GB bandwidth/month
- **Render Web Service**: 750 hours/month, sleeps after 15min inactivity
- **Render Static Site**: 100GB bandwidth/month
- **Vercel**: 100GB bandwidth/month, 100k function executions

## Next Steps

1. Set up custom domains (optional)
2. Configure SSL certificates (automatic with Render/Vercel)
3. Set up monitoring and logging
4. Configure backups for production data
5. Set up CI/CD pipelines for automatic deployments

## Security Notes

- Generate a strong SECRET_KEY for production
- Never commit sensitive environment variables to Git
- Use environment variables for all configuration
- Enable HTTPS only (Render/Vercel do this automatically)
- Regularly update dependencies
